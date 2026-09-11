"""Local Faster-Whisper ASR with an opt-in deterministic demo fallback."""

from __future__ import annotations

import math
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any


class ASRError(Exception):
    """A safe-to-report ASR service error."""


class ASRUnavailableError(ASRError):
    pass


class InvalidAudioError(ASRError):
    pass


class EmptyTranscriptError(ASRError):
    pass


@dataclass(frozen=True)
class TranscriptionResult:
    transcript: str
    language: str
    confidence: float


@lru_cache(maxsize=1)
def get_whisper_model() -> Any:
    """Load small CPU/int8 Faster-Whisper once, on the first ASR request."""
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise ASRUnavailableError("Local speech recognition is not installed.") from exc
    try:
        return WhisperModel(
            os.getenv("VOICEPATH_ASR_MODEL", "small"),
            device="cpu",
            compute_type="int8",
        )
    except Exception as exc:
        raise ASRUnavailableError("Local speech recognition model is unavailable.") from exc


def _configured_demo(language: str | None) -> TranscriptionResult | None:
    """Use a known transcript only when the operator explicitly enables it."""
    transcript = os.getenv("VOICEPATH_DEMO_TRANSCRIPT", "").strip()
    if not transcript:
        return None
    return TranscriptionResult(
        transcript=transcript,
        language=language or os.getenv("VOICEPATH_DEMO_LANGUAGE", "en"),
        confidence=0.65,
    )


def _is_probable_audio(path: Path) -> bool:
    # Prevent obviously invalid input from becoming a deterministic demo result.
    header = path.read_bytes()[:16]
    return (
        header.startswith(b"RIFF") and b"WAVE" in header
        or header.startswith((b"ID3", b"OggS", b"fLaC", b"#!AMR", b"\x1aE\xdf\xa3"))
        or header[:1] == b"\xff"
        or b"ftyp" in header
    )


def _confidence(segments: list[Any]) -> float:
    """Bounded confidence-like signal; it is not a calibrated probability."""
    log_probs = [float(s.avg_logprob) for s in segments if getattr(s, "avg_logprob", None) is not None]
    if not log_probs:
        return 0.70
    value = math.exp(sum(log_probs) / len(log_probs))
    no_speech = [float(s.no_speech_prob) for s in segments if getattr(s, "no_speech_prob", None) is not None]
    if no_speech:
        value *= 1 - min(max(sum(no_speech) / len(no_speech), 0), 0.5)
    return round(min(max(value, 0), 1), 2)


def _invalid_input_error(exc: Exception) -> bool:
    message = str(exc).casefold()
    return any(term in message for term in ("invalid data", "failed to open", "error opening", "unsupported format"))


def transcribe_audio(audio_path: str | Path, language: str | None = None) -> TranscriptionResult:
    """Transcribe one audio file with Faster-Whisper.

    Tamil, English, and some code-switching are supported by Whisper, but
    accuracy still depends on the recording, accent, and language mix.
    """
    path = Path(audio_path)
    if not path.is_file() or path.stat().st_size == 0 or not _is_probable_audio(path):
        raise InvalidAudioError("The uploaded file is not valid audio.")
    requested_language = language.strip().lower() if language else None
    try:
        model = get_whisper_model()
        generated, info = model.transcribe(
            str(path), language=requested_language, beam_size=5, vad_filter=True
        )
        segments = list(generated)
    except ASRUnavailableError:
        demo = _configured_demo(requested_language)
        if demo:
            return demo
        raise
    except Exception as exc:
        if _invalid_input_error(exc):
            raise InvalidAudioError("The uploaded file is not valid audio.") from exc
        demo = _configured_demo(requested_language)
        if demo:
            return demo
        raise ASRUnavailableError("Speech recognition could not complete.") from exc

    transcript = " ".join(str(getattr(s, "text", "")).strip() for s in segments).strip()
    if not transcript:
        raise EmptyTranscriptError("No speech was detected in the uploaded audio.")
    detected_language = str(getattr(info, "language", "") or requested_language or "unknown")
    return TranscriptionResult(transcript, detected_language, _confidence(segments))
