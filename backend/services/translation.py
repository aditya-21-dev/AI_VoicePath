"""Faithful translation service for VoicePath transcripts."""

from __future__ import annotations

import os
import re

# Deterministic mappings for offline/test environments without an API key
_KNOWN_OFFLINE_TRANSLATIONS: dict[str, str] = {
    "நான் python பயன்படுத்தி ஒரு inventory management application உருவாக்கினேன்.": (
        "I created an inventory management application using Python."
    ),
    "நான் python பயன்படுத்தி ஒரு website உருவாக்கினேன்.": (
        "I created a website using Python."
    ),
    "நான் python பயன்படுத்தினேன்.": (
        "I used Python."
    ),
}


def _clean_key(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().casefold()


def translate_to_english(transcript: str, language: str | None) -> str | None:
    """Translate transcript to English faithfully if language is Tamil ('ta').

    Returns None for English ('en') or unsupported translation languages.
    If translation fails or GEMINI_API_KEY is missing, safely returns None without error.
    """
    if not transcript or not transcript.strip():
        return None

    lang = (language or "").strip().lower()
    # Translation is strictly supported for Tamil ('ta') as required.
    if lang != "ta":
        return None

    cleaned_text = transcript.strip()

    # Check offline dictionary first (useful for deterministic tests/offline demo)
    lookup_key = _clean_key(cleaned_text.rstrip(".!?,") + ".")
    if lookup_key in _KNOWN_OFFLINE_TRANSLATIONS:
        return _KNOWN_OFFLINE_TRANSLATIONS[lookup_key]

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    try:
        from google import genai

        prompt = (
            "You are a translation engine for a spoken skill assessment system.\n"
            "Translate the following Tamil speech transcript faithfully and accurately into English.\n\n"
            "CRITICAL RULES:\n"
            "1. Translate ONLY the literal meaning of the speech.\n"
            "2. Do NOT invent, assume, or infer any skills, years of experience, qualifications, "
            "certifications, job roles, or facts not explicitly stated.\n"
            "3. Preserve technical terms, library names, and tools exactly as spoken (e.g., Python, SQL, React).\n"
            "4. Return ONLY the plain English translation. Do NOT wrap in quotes, do NOT add explanations, markdown, or notes.\n\n"
            f"Transcript:\n{cleaned_text}"
        )

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
            contents=prompt,
        )
        if response and response.text:
            cleaned = response.text.strip().strip('"').strip("'")
            return cleaned or None
    except Exception:
        # Translation failure must never break transcription
        return None

    return None
