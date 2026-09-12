import sys
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.schemas.profile import ProfileResponse, Skill
from backend.services import asr
from backend.services import extraction
from backend.services.asr import (
    ASRUnavailableError,
    EmptyTranscriptError,
    InvalidAudioError,
    SUPPORTED_LANGUAGES,
    TranscriptionResult,
    UnsupportedLanguageError,
)
from backend.services.extraction import ExtractionError, extract_profile
from backend.services.normalization import normalize_skill


@pytest.fixture(autouse=True)
def no_gemini_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)


def write_wav_marker(tmp_path):
    path = tmp_path / "sample.wav"
    path.write_bytes(b"RIFF\x00\x00\x00\x00WAVEfmt \x00\x00\x00\x00")
    return path


class FakeModel:
    def __init__(self, text="I know Python and SQL.", language="en"):
        self.text, self.language = text, language
        self.calls = []

    def transcribe(self, *_args, **kwargs):
        self.calls.append(kwargs)
        segment = SimpleNamespace(text=self.text, avg_logprob=-0.1, no_speech_prob=0.02)
        return iter([segment]), SimpleNamespace(language=self.language)


def test_supported_languages_are_hackathon_six_only():
    assert SUPPORTED_LANGUAGES == frozenset({"en", "ta", "hi", "te", "ml", "kn"})
    assert "bn" not in SUPPORTED_LANGUAGES
    assert "mr" not in SUPPORTED_LANGUAGES


def test_english_audio_transcript(monkeypatch, tmp_path):
    model = FakeModel()
    monkeypatch.setattr(asr, "get_whisper_model", lambda: model)
    result = asr.transcribe_audio(write_wav_marker(tmp_path), "en")
    assert result.transcript == "I know Python and SQL."
    assert result.language == "en"
    assert 0 <= result.confidence <= 1
    assert model.calls[0]["language"] == "en"


@pytest.mark.parametrize("language", ["en", "ta", "hi", "te", "ml", "kn"])
def test_supported_single_language_forces_whisper_language(monkeypatch, tmp_path, language):
    model = FakeModel(text="I know Python.", language=language)
    monkeypatch.setattr(asr, "get_whisper_model", lambda: model)
    result = asr.transcribe_audio(write_wav_marker(tmp_path), language)
    assert result.transcript == "I know Python."
    assert result.language == language
    assert model.calls[0]["language"] == language
    assert model.calls[0]["task"] == "transcribe"
    assert model.calls[0]["task"] != "translate"


def test_multilingual_auto_does_not_force_whisper_language(monkeypatch, tmp_path):
    transcript = "நான் Python பயன்படுத்தி ஒரு web application develop பண்ணினேன்."
    model = FakeModel(text=transcript, language="ta")
    monkeypatch.setattr(asr, "get_whisper_model", lambda: model)
    result = asr.transcribe_audio(write_wav_marker(tmp_path), "auto")
    assert result.transcript == transcript
    assert result.language == "ta"
    assert "language" not in model.calls[0]
    assert model.calls[0]["task"] == "transcribe"
    assert model.calls[0]["task"] != "translate"


@pytest.mark.parametrize("language", ["bn", "mr", "fr"])
def test_invalid_unsupported_language_rejected(tmp_path, language):
    with pytest.raises(UnsupportedLanguageError):
        asr.transcribe_audio(write_wav_marker(tmp_path), language)


@pytest.mark.parametrize("detected_language", ["bn", "mr"])
def test_auto_detected_unsupported_language_rejected(monkeypatch, tmp_path, detected_language):
    model = FakeModel(text="I used Python.", language=detected_language)
    monkeypatch.setattr(asr, "get_whisper_model", lambda: model)
    with pytest.raises(UnsupportedLanguageError, match="Detected language is not supported"):
        asr.transcribe_audio(write_wav_marker(tmp_path), "auto")
    assert "language" not in model.calls[0]
    assert model.calls[0]["task"] == "transcribe"


def test_whisper_model_is_reused(monkeypatch):
    constructed = []

    class FakeWhisperModel:
        def __init__(self, *_args, **_kwargs):
            constructed.append(self)

    monkeypatch.setitem(sys.modules, "faster_whisper", SimpleNamespace(WhisperModel=FakeWhisperModel))
    asr.get_whisper_model.cache_clear()
    try:
        first = asr.get_whisper_model()
        second = asr.get_whisper_model()
    finally:
        asr.get_whisper_model.cache_clear()

    assert first is second
    assert len(constructed) == 1


def test_indian_language_and_code_switched_extraction():
    profile = extract_profile("???? shop-?? stock manage ?????????. customers-? handle ?????????.")
    assert profile.domain == ["Retail"]
    assert {skill.canonical_name for skill in profile.skills} == {"Inventory Management", "Customer Handling"}


def test_explicit_skill_has_evidence_and_high_confidence():
    profile = extract_profile("I know Python and SQL.")
    assert {skill.canonical_name for skill in profile.skills} == {"Python", "SQL"}
    assert all(skill.evidence in "I know Python and SQL." and skill.inference_type == "explicit" for skill in profile.skills)
    assert all(0.9 <= skill.confidence <= 1 for skill in profile.skills)


def test_english_explicit_python_and_sql_inventory_system():
    profile = extract_profile("I used Python and SQL to build an inventory management system.")
    skills = {skill.canonical_name: skill for skill in profile.skills}
    assert {"Python", "SQL"} <= set(skills)
    assert skills["Python"].evidence == "I used Python and SQL to build an inventory management system."
    assert skills["SQL"].inference_type == "explicit"


def test_tamil_english_python_skill_keeps_transcript_evidence():
    transcript = "நான் Python பயன்படுத்தி ஒரு inventory management application உருவாக்கினேன்."
    profile = extract_profile(transcript)
    skills = {skill.canonical_name: skill for skill in profile.skills}
    assert "Python" in skills
    assert skills["Python"].raw_phrase == "Python"
    assert skills["Python"].evidence == transcript
    assert skills["Python"].inference_type == "explicit"


def test_tamil_english_react_skill():
    transcript = "நான் React பயன்படுத்தி ஒரு website உருவாக்கினேன்."
    profile = extract_profile(transcript)
    skills = {skill.canonical_name: skill for skill in profile.skills}
    assert "React" in skills
    assert skills["React"].evidence == transcript
    assert skills["React"].inference_type == "explicit"


def test_tamil_semantic_database_management_without_unrelated_stack():
    transcript = "நான் ஒரு website உருவாக்கி database-ஐ manage பண்ணினேன்."
    profile = extract_profile(transcript)
    names = {skill.canonical_name for skill in profile.skills}
    assert "Database Management" in names
    assert {"Python", "SQL", "React", "Docker", "Java"}.isdisjoint(names)
    assert all(skill.evidence == transcript for skill in profile.skills)


def test_tamil_code_switching_extracts_named_stack_and_supported_web_skill():
    transcript = "நான் ஒரு web application develop பண்ணினேன் using React and Python."
    profile = extract_profile(transcript)
    names = {skill.canonical_name for skill in profile.skills}
    assert {"React", "Python", "Web Development"} <= names
    assert all(skill.evidence == transcript for skill in profile.skills)


def test_ambiguous_tamil_technology_statement_does_not_create_random_skills():
    profile = extract_profile("எனக்கு technology பற்றி தெரியும்.")
    assert profile.skills == []


def test_multilingual_tamil_english_extracts_grounded_skills_only():
    transcript = "நான் Python பயன்படுத்தி ஒரு web application develop பண்ணினேன்."
    profile = extract_profile(transcript)
    skills = {skill.canonical_name: skill for skill in profile.skills}
    assert "Python" in skills
    assert "Web Development" in skills
    assert skills["Python"].evidence == transcript
    assert skills["Web Development"].evidence == transcript
    assert {skill.evidence for skill in profile.skills} == {transcript}
    assert {"Java", "SQL", "React", "Docker"}.isdisjoint(skills)


def test_hindi_english_code_switch_extracts_evidence_backed_skills():
    transcript = "मैं Python का उपयोग करके web application बनाया and then I tested it."
    profile = extract_profile(transcript)
    skills = {skill.canonical_name: skill for skill in profile.skills}
    assert "Python" in skills
    assert skills["Python"].evidence == transcript
    assert {"Java", "SQL", "React", "Docker"}.isdisjoint(skills)


def test_telugu_english_code_switch_extracts_evidence_backed_skills():
    transcript = "నేను React use చేసి website build చేశాను."
    profile = extract_profile(transcript)
    skills = {skill.canonical_name: skill for skill in profile.skills}
    assert "React" in skills
    assert "Web Development" in skills
    assert all(skill.evidence == transcript for skill in profile.skills)


def test_tamil_no_useful_skill_statement():
    profile = extract_profile("நான் தினமும் college போகிறேன்.")
    assert profile.skills == []
    assert profile.experience_years is None


def test_textile_company_does_not_invent_experience_or_expertise():
    profile = extract_profile("I worked in a textile company.")
    assert profile.experience_years is None
    assert profile.skills == []
    assert profile.roles == []


def test_tamil_experience_extracts_duration_and_role_only_when_stated():
    profile = extract_profile("நான் இரண்டு வருடமாக Python developer ஆக வேலை செய்கிறேன்.")
    assert profile.experience_years == 2
    assert profile.roles == ["Python Developer"]

    profile = extract_profile("நான் Python developer ஆக வேலை செய்கிறேன்.")
    assert profile.experience_years is None
    assert profile.roles == ["Python Developer"]


def test_implicit_skill_is_explainable_and_conservative():
    profile = extract_profile("I keep track of materials coming in and going out.")
    skill = profile.skills[0]
    assert skill.canonical_name == "Inventory Management"
    assert skill.inference_type == "implicit"
    assert skill.confidence == 0.76
    assert skill.evidence == "I keep track of materials coming in and going out."


def test_ambiguous_shop_word_does_not_create_skills():
    profile = extract_profile("I worked in a shop.")
    assert profile.domain == ["Retail"]
    assert profile.skills == []


def test_no_useful_skill_and_multiple_domains():
    assert extract_profile("I enjoy my work.").skills == []
    profile = extract_profile("I use Python for data analysis and cloud deployment.")
    assert {"Software Development", "Data Analytics", "Cloud Computing"} <= set(profile.domain)


def test_experience_and_responsibilities():
    profile = extract_profile("I have worked as a store assistant for four years. I manage stock and handle customers.")
    assert profile.experience_years == 4
    assert profile.roles == ["Store Assistant"]
    assert profile.responsibilities == ["manage stock", "handle customers"]


@pytest.mark.parametrize(
    ("phrase", "canonical"),
    [
        ("manage stock", "Inventory Management"),
        ("handling inventory", "Inventory Management"),
        ("coding in Python", "Python"),
        ("React JS", "React"),
        ("database management", "Database Management"),
        ("talking with customers", "Customer Handling"),
    ],
)
def test_skill_normalization(phrase, canonical):
    assert normalize_skill(phrase) == canonical


def test_schema_validation_and_confidence_range():
    skill = Skill(canonical_name="Python", raw_phrase="Python", evidence="I know Python.", confidence=0.95, inference_type="explicit")
    assert ProfileResponse(skills=[skill]).skills[0].canonical_name == "Python"
    with pytest.raises(Exception):
        Skill(canonical_name="Python", raw_phrase="Python", evidence="I know Python.", confidence=1.1, inference_type="explicit")


def test_missing_gemini_key_uses_deterministic_fallback(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    assert extract_profile("I know Python.").skills[0].canonical_name == "Python"


def test_gemini_failure_uses_safe_deterministic_fallback(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "demo-key")
    monkeypatch.setattr(extraction, "_gemini_extract", lambda _: (_ for _ in ()).throw(ExtractionError()))
    profile = extract_profile("I used Python to build an inventory management system.")
    assert "Python" in {skill.canonical_name for skill in profile.skills}


def test_asr_failure_invalid_audio_and_empty_speech(monkeypatch, tmp_path):
    audio = write_wav_marker(tmp_path)
    monkeypatch.delenv("VOICEPATH_DEMO_TRANSCRIPT", raising=False)
    monkeypatch.setattr(asr, "get_whisper_model", lambda: (_ for _ in ()).throw(ASRUnavailableError()))
    with pytest.raises(ASRUnavailableError):
        asr.transcribe_audio(audio)

    bad = tmp_path / "bad.wav"
    bad.write_text("not audio")
    with pytest.raises(InvalidAudioError):
        asr.transcribe_audio(bad)

    monkeypatch.setattr(asr, "get_whisper_model", lambda: FakeModel(text="   "))
    with pytest.raises(EmptyTranscriptError):
        asr.transcribe_audio(audio)


def test_api_contracts(monkeypatch):
    client = TestClient(app)
    assert client.get("/api/v1/health").json() == {"status": "ok"}

    response = client.post("/api/v1/extract-profile", json={"transcript": "I know Python."})
    assert response.status_code == 200
    skill = response.json()["skills"][0]
    assert set(skill) == {"canonical_name", "raw_phrase", "evidence", "confidence", "inference_type"}

    response = client.post("/api/v1/extract-profile", json={"transcript": "  "})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "EMPTY_TRANSCRIPT"

    monkeypatch.setattr("backend.main.transcribe_audio", lambda *_: TranscriptionResult("hello", "en", 0.9))
    response = client.post(
        "/api/v1/transcribe",
        files={"audio": ("sample.wav", b"RIFF\x00\x00\x00\x00WAVEfmt \x00\x00\x00\x00", "audio/wav")},
        data={"language": "en"},
    )
    assert response.status_code == 200
    assert response.json() == {"transcript": "hello", "language": "en", "confidence": 0.9}

    monkeypatch.setattr(
        "backend.main.transcribe_audio",
        lambda *_: TranscriptionResult("நான் Python பயன்படுத்தினேன்.", "ta", 0.8),
    )
    response = client.post(
        "/api/v1/transcribe",
        files={"audio": ("sample.wav", b"RIFF\x00\x00\x00\x00WAVEfmt \x00\x00\x00\x00", "audio/wav")},
        data={"language": "auto"},
    )
    assert response.status_code == 200
    assert set(response.json()) == {"transcript", "language", "confidence"}
    assert response.json()["language"] == "ta"

    monkeypatch.setattr(
        "backend.main.transcribe_audio",
        lambda *_: (_ for _ in ()).throw(UnsupportedLanguageError("Unsupported transcription language: fr")),
    )
    response = client.post(
        "/api/v1/transcribe",
        files={"audio": ("sample.wav", b"RIFF\x00\x00\x00\x00WAVEfmt \x00\x00\x00\x00", "audio/wav")},
        data={"language": "fr"},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "UNSUPPORTED_LANGUAGE"
    assert response.json()["error"]["message"] == "Unsupported transcription language: fr"

    monkeypatch.setattr(
        "backend.main.transcribe_audio",
        lambda *_: (_ for _ in ()).throw(UnsupportedLanguageError("Detected language is not supported by VoicePath.")),
    )
    response = client.post(
        "/api/v1/transcribe",
        files={"audio": ("sample.wav", b"RIFF\x00\x00\x00\x00WAVEfmt \x00\x00\x00\x00", "audio/wav")},
        data={"language": "auto"},
    )
    assert response.status_code == 400
    assert response.json() == {
        "error": {
            "code": "UNSUPPORTED_LANGUAGE",
            "message": "Detected language is not supported by VoicePath.",
        }
    }

    monkeypatch.setattr(
        "backend.main.transcribe_audio",
        lambda *_: (_ for _ in ()).throw(ASRUnavailableError("ASR unavailable")),
    )
    response = client.post(
        "/api/v1/transcribe",
        files={"audio": ("sample.wav", b"RIFF\x00\x00\x00\x00WAVEfmt \x00\x00\x00\x00", "audio/wav")},
        data={"language": "auto"},
    )
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "ASR_UNAVAILABLE"
