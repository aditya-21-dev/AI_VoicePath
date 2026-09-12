"""Contract-focused FastAPI application for the Member 2 handoff."""

from __future__ import annotations

import logging
import tempfile
from pathlib import Path

logger = logging.getLogger('voicepath.api')

from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from backend.schemas.profile import (
    ExtractProfileRequest,
    MatchOpportunitiesRequest,
    ProfileResponse,
    TranscriptionResponse,
)
from backend.services.asr import (
    ASRUnavailableError,
    EmptyTranscriptError as ASREmptyTranscriptError,
    InvalidAudioError,
    UnsupportedLanguageError,
    transcribe_audio,
)
from backend.services.extraction import (
    EmptyTranscriptError as ExtractionEmptyTranscriptError,
    extract_profile,
)
from backend.services.matching_service import match_skills_to_opportunities
from backend.services.translation import translate_to_english

app = FastAPI(title="VoicePath API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
_MAX_AUDIO_BYTES = 25 * 1024 * 1024


class APIError(Exception):
    def __init__(self, code: str, message: str, status_code: int) -> None:
        self.code, self.message, self.status_code = code, message, status_code


@app.exception_handler(APIError)
async def api_error(_: Request, exc: APIError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    locations = [error["loc"] for error in exc.errors()]
    if any("transcript" in location for location in locations):
        code, message = "EMPTY_TRANSCRIPT", "Transcript must not be empty."
    elif any("audio" in location for location in locations):
        code, message = "INVALID_AUDIO", "An audio upload is required."
    else:
        code, message = "INVALID_PROFILE", "Request data does not match the API contract."
    return JSONResponse(
        status_code=422,
        content={"error": {"code": code, "message": message}},
    )


@app.exception_handler(Exception)
async def unexpected_error(_: Request, __: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected service error occurred."}},
    )


@app.get("/api/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


def _determine_audio_suffix(audio: UploadFile, sample_bytes: bytes = b"") -> str:
    filename = (audio.filename or "").strip()
    if filename:
        ext = Path(filename).suffix.lower()
        if ext in {".m4a", ".webm", ".wav", ".mp3", ".ogg", ".flac", ".aac", ".mp4", ".opus"}:
            return ext
        if ext and ext != ".bin":
            return ext

    content_type = (audio.content_type or "").lower().split(";")[0].strip()
    content_map = {
        "audio/x-m4a": ".m4a",
        "audio/m4a": ".m4a",
        "audio/mp4": ".m4a",
        "video/mp4": ".mp4",
        "audio/webm": ".webm",
        "video/webm": ".webm",
        "audio/wav": ".wav",
        "audio/x-wav": ".wav",
        "audio/wave": ".wav",
        "audio/mpeg": ".mp3",
        "audio/mp3": ".mp3",
        "audio/ogg": ".ogg",
        "audio/flac": ".flac",
        "audio/aac": ".aac",
    }
    if content_type in content_map:
        return content_map[content_type]

    if sample_bytes:
        if sample_bytes.startswith(b"RIFF") and b"WAVE" in sample_bytes[:16]:
            return ".wav"
        if b"ftyp" in sample_bytes[:16]:
            return ".m4a"
        if sample_bytes.startswith(b"\x1aE\xdf\xa3"):
            return ".webm"
        if sample_bytes.startswith(b"ID3") or sample_bytes[:2] == b"\xff\xfb":
            return ".mp3"
        if sample_bytes.startswith(b"OggS"):
            return ".ogg"
        if sample_bytes.startswith(b"fLaC"):
            return ".flac"

    return ".m4a"


async def _save_audio(audio: UploadFile) -> Path:
    # Read initial chunk to inspect header and verify not empty
    first_chunk = await audio.read(1024 * 1024)
    if not first_chunk:
        raise APIError("INVALID_AUDIO", "Uploaded audio is empty.", 400)
    if len(first_chunk) > _MAX_AUDIO_BYTES:
        raise APIError("INVALID_AUDIO", "Uploaded audio exceeds the 25 MB limit.", 400)

    suffix = _determine_audio_suffix(audio, first_chunk)
    temporary = tempfile.NamedTemporaryFile(prefix="voicepath-", suffix=suffix, delete=False)
    path = Path(temporary.name)
    total = len(first_chunk)
    try:
        temporary.write(first_chunk)
        while chunk := await audio.read(1024 * 1024):
            total += len(chunk)
            if total > _MAX_AUDIO_BYTES:
                raise APIError("INVALID_AUDIO", "Uploaded audio exceeds the 25 MB limit.", 400)
            temporary.write(chunk)
    except Exception:
        temporary.close()
        path.unlink(missing_ok=True)
        raise
    finally:
        temporary.close()

    return path


@app.post("/api/v1/transcribe", response_model=TranscriptionResponse, response_model_exclude_none=True)
async def transcribe(
    audio: UploadFile = File(...), language: str | None = Form(default=None)
) -> TranscriptionResponse:
    path = await _save_audio(audio)
    try:
        result = await run_in_threadpool(transcribe_audio, path, language)
        translation: str | None = None
        requested_lang = (language or "").strip().lower()
        if requested_lang == "ta":
            translation = await run_in_threadpool(translate_to_english, result.transcript, "ta")

        return TranscriptionResponse(
            transcript=result.transcript,
            language=result.language,
            confidence=result.confidence,
            translation=translation,
        )
    except InvalidAudioError as exc:
        logger.warning("Invalid audio upload: %s", exc)
        raise APIError("INVALID_AUDIO", "The uploaded file is not valid audio.", 400) from exc
    except ASREmptyTranscriptError as exc:
        logger.warning("Empty transcript detected: %s", exc)
        raise APIError("EMPTY_TRANSCRIPT", "No speech was detected in the uploaded audio.", 422) from exc
    except UnsupportedLanguageError as exc:
        logger.warning("Unsupported language requested: %s", exc)
        raise APIError("UNSUPPORTED_LANGUAGE", str(exc) or "Unsupported transcription language.", 400) from exc
    except ASRUnavailableError as exc:
        logger.exception("ASR transcription failed: %s", exc)
        raise APIError("ASR_UNAVAILABLE", "Speech recognition service is temporarily unavailable.", 503) from exc
    except Exception as exc:
        logger.exception("Unexpected error during ASR transcription: %s", exc)
        raise APIError("ASR_UNAVAILABLE", "Speech recognition service is temporarily unavailable.", 503) from exc
    finally:
        path.unlink(missing_ok=True)
        await audio.close()


@app.post("/api/v1/extract-profile", response_model=ProfileResponse)
async def extract_profile_endpoint(request: ExtractProfileRequest) -> ProfileResponse:
    try:
        return await run_in_threadpool(extract_profile, request.transcript)
    except ExtractionEmptyTranscriptError as exc:
        raise APIError("EMPTY_TRANSCRIPT", "Transcript must not be empty.", 422) from exc
    except Exception as exc:
        raise APIError("EXTRACTION_UNAVAILABLE", "Profile extraction is temporarily unavailable.", 503) from exc


@app.post("/api/v1/match-opportunities")
async def match_opportunities_endpoint(request: MatchOpportunitiesRequest) -> list[dict]:
    return await run_in_threadpool(
        match_skills_to_opportunities,
        user_skills=request.skills,
        user_experience_years=request.experience_years,
        district=request.district,
        domain=request.domain,
    )
