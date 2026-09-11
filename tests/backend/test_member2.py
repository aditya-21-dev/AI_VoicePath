from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.schemas.profile import ProfileResponse, Skill
from backend.services import asr
from backend.services.asr import ASRUnavailableError, EmptyTranscriptError, InvalidAudioError, TranscriptionResult
from backend.services.extraction import extract_profile
from backend.services.normalization import normalize_skill


def write_wav_marker(tmp_path):
    path = tmp_path / "sample.wav"
    path.write_bytes(b"RIFF\x00\x00\x00\x00WAVEfmt \x00\x00\x00\x00")
    return path


class FakeModel:
    def __init__(self, text="I know Python and SQL.", language="en"):
        self.text, self.language = text, language

    def transcribe(self, *_args, **_kwargs):
        segment = SimpleNamespace(text=self.text, avg_logprob=-0.1, no_speech_prob=0.02)
        return iter([segment]), SimpleNamespace(language=self.language)


def test_english_audio_transcript(monkeypatch, tmp_path):
    monkeypatch.setattr(asr, "get_whisper_model", lambda: FakeModel())
    result = asr.transcribe_audio(write_wav_marker(tmp_path), "en")
    assert result.transcript == "I know Python and SQL."
    assert result.language == "en"
    assert 0 <= result.confidence <= 1


def test_indian_language_and_code_switched_extraction():
    profile = extract_profile("???? shop-?? stock manage ?????????. customers-? handle ?????????.")
    assert profile.domain == ["Retail"]
    assert {skill.canonical_name for skill in profile.skills} == {"Inventory Management", "Customer Handling"}


def test_explicit_skill_has_evidence_and_high_confidence():
    profile = extract_profile("I know Python and SQL.")
    assert {skill.canonical_name for skill in profile.skills} == {"Python", "SQL"}
    assert all(skill.evidence in "I know Python and SQL." and skill.inference_type == "explicit" for skill in profile.skills)
    assert all(0.9 <= skill.confidence <= 1 for skill in profile.skills)


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
