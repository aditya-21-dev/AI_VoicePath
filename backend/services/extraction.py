"""Evidence-first profile extraction with Gemini and deterministic fallback."""

from __future__ import annotations

import datetime as dt
import json
import os
import re
from collections.abc import Iterable

from backend.schemas.profile import ProfileResponse, Skill
from backend.services.normalization import normalize_skill, normalize_skills


class ExtractionError(Exception):
    pass


class EmptyTranscriptError(ExtractionError):
    pass


def _sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?\u0964\u0965])\s+|\n+", text) if s.strip()]


def _evidence(phrase: str, sentences: Iterable[str]) -> str:
    values = list(sentences)
    for sentence in values:
        if phrase.casefold() in sentence.casefold():
            return sentence
    return values[0] if values else phrase


def _unique(values: Iterable[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        value = value.strip(" ,.;:")
        if value and value.casefold() not in seen:
            seen.add(value.casefold())
            result.append(value)
    return result


def _domains(text: str) -> list[str]:
    lowered = text.casefold()
    rules = (
        ("Retail", ("shop", "store", "retail", "supermarket")),
        ("Software Development", ("software", "developer", "programming", "python", "coding")),
        ("Data Analytics", ("data analysis", "data analytics", "analyse data", "analyze data")),
        ("Machine Learning", ("machine learning",)),
        ("Cloud Computing", ("cloud infrastructure", "cloud computing", "cloud deployment")),
    )
    return [domain for domain, markers in rules if any(marker in lowered for marker in markers)]


def _experience_years(text: str) -> float | None:
    lowered = text.casefold()
    match = re.search(r"\b(?:for|over|about|around)\s+(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\b", lowered)
    match = match or re.search(r"\b(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s+(?:of\s+)?experience\b", lowered)
    if match:
        return float(match.group(1))
    words = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}
    match = re.search(r"\b(?:for|over|about|around)\s+(" + "|".join(words) + r")\s+years?\b", lowered)
    if match:
        return float(words[match.group(1)])
    match = re.search(r"\bsince\s+(20\d{2})\b", lowered)
    if match and any(token in lowered for token in ("work", "worked", "working", "job", "shop", "role", "experience")):
        years = dt.date.today().year - int(match.group(1))
        if 0 <= years <= 60:
            return float(years)
    return None


def _roles(text: str) -> list[str]:
    found = []
    for match in re.finditer(r"\b(?:worked|working|served)\s+as\s+(?:an?\s+)?([^.,;]+)", text, re.I):
        role = re.split(r"\s+(?:for|and|where)\s+", match.group(1), maxsplit=1, flags=re.I)[0].strip()
        if 1 <= len(role.split()) <= 5:
            found.append(role.title())
    return _unique(found)


RESPONSIBILITY_PATTERNS = (
    r"\b(?:manage|managed|managing)\s+(?:the\s+)?stock\b",
    r"\b(?:handle|handled|handling)\s+(?:the\s+)?customers?\b",
    r"\bcheck(?:ed|ing)?\s+(?:incoming\s+)?products?\b",
    r"\bupdate(?:d|ing)?\s+(?:the\s+)?records?\b",
    r"\bkeep\s+track\s+of\s+materials\s+coming\s+in\s+and\s+going\s+out\b",
    r"\bstock\s+manage\b",
    r"\bcustomers?[^\s]*\s+handle\b",
)
DIRECT_SKILL_PATTERNS = (
    ("Inventory Management", r"\b(?:manage|managed|managing)\s+(?:the\s+)?stock\b|\bstock\s+management\b|\b(?:handle|handling)\s+inventory\b|\binventory\s+(?:handling|management)\b|\bstock\s+manage\b"),
    ("Customer Handling", r"\b(?:handle|handled|handling|talk(?:ing)?\s+with)\s+(?:the\s+)?customers?\b|\bcustomers?[^\s]*\s+handle\b"),
    ("Python", r"\b(?:used\s+)?python(?:\s+programming)?\b|\bcoding\s+in\s+python\b"),
    ("SQL", r"\b(?:used\s+)?sql\b"),
    ("Data Analysis", r"\bdata\s+analysis\b|\bdata\s+analy[sz](?:e|ed|ing)\b"),
    ("Machine Learning", r"\bmachine\s+learning\b"),
    ("Cloud Computing", r"\bcloud\s+(?:computing|infrastructure|deployment)\b"),
)
IMPLICIT_SKILL_PATTERNS = (
    ("Inventory Management", r"\bkeep\s+track\s+of\s+materials\s+coming\s+in\s+and\s+going\s+out\b"),
)


def _responsibilities(text: str) -> list[str]:
    return _unique(
        match.group(0).casefold()
        for pattern in RESPONSIBILITY_PATTERNS
        for match in re.finditer(pattern, text, re.I)
    )


def _skills(text: str, sentences: list[str]) -> list[Skill]:
    found: list[Skill] = []
    for canonical, pattern in DIRECT_SKILL_PATTERNS:
        for match in re.finditer(pattern, text, re.I):
            raw = match.group(0)
            normalized = normalize_skill(raw) or canonical
            found.append(Skill(
                canonical_name=normalized, raw_phrase=raw, evidence=_evidence(raw, sentences),
                confidence=0.95 if normalized in {"Python", "SQL"} else 0.94,
                inference_type="explicit",
            ))
    for canonical, pattern in IMPLICIT_SKILL_PATTERNS:
        for match in re.finditer(pattern, text, re.I):
            raw = match.group(0)
            found.append(Skill(
                canonical_name=canonical, raw_phrase=raw, evidence=_evidence(raw, sentences),
                confidence=0.76, inference_type="implicit",
            ))
    return normalize_skills(found)


def deterministic_extract(transcript: str) -> ProfileResponse:
    """Extract only facts directly stated or strongly explained by the transcript."""
    transcript = transcript.strip()
    if not transcript:
        raise EmptyTranscriptError("Transcript is empty.")
    sentences = _sentences(transcript)
    return ProfileResponse(
        domain=_domains(transcript),
        experience_years=_experience_years(transcript),
        roles=_roles(transcript),
        responsibilities=_responsibilities(transcript),
        skills=_skills(transcript, sentences),
    )


def _gemini_extract(transcript: str) -> ProfileResponse:
    """Use the current Google GenAI SDK; validate all model output locally."""
    try:
        from google import genai
        from google.genai import types
        prompt = """Return JSON only for this transcript with: domain, experience_years, roles,
responsibilities, skills. Each skill needs canonical_name, raw_phrase, evidence, confidence
(0..1), inference_type (explicit|implicit). Include only claims supported by the transcript.
Keep source-language wording in raw_phrase/evidence. Never create qualifications, certificates,
courses, jobs, opportunities, schemes, eligibility, or recommendations.

Transcript:
""" + transcript
        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        profile = ProfileResponse.model_validate(json.loads(response.text))
    except Exception as exc:
        raise ExtractionError("Gemini extraction failed.") from exc

    source = transcript.casefold()
    verified = [s for s in profile.skills if s.raw_phrase.casefold() in source and s.evidence.casefold() in source]
    return profile.model_copy(update={"skills": normalize_skills(verified)})


def extract_profile(transcript: str) -> ProfileResponse:
    """Use Gemini when configured; otherwise return the same-schema rule fallback."""
    if not transcript or not transcript.strip():
        raise EmptyTranscriptError("Transcript is empty.")
    if os.getenv("GEMINI_API_KEY", "").strip():
        try:
            return _gemini_extract(transcript)
        except ExtractionError:
            pass
    return deterministic_extract(transcript)
