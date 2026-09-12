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


NUMBER_WORDS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "ஒரு": 1,
    "ஒன்று": 1,
    "இரண்டு": 2,
    "மூன்று": 3,
    "நான்கு": 4,
    "ஐந்து": 5,
    "ஆறு": 6,
    "ஏழு": 7,
    "எட்டு": 8,
    "ஒன்பது": 9,
    "பத்து": 10,
    "एक": 1,
    "दो": 2,
    "तीन": 3,
    "चार": 4,
    "पांच": 5,
    "पाँच": 5,
}
YEAR_MARKERS = r"(?:years?|yrs?|வருட(?:ம்|மாக)?|வருஷ(?:ம்|மாக)?|ஆண்டு(?:கள்|களாக)?|साल|वर्ष|సంవత్సరాలు|വർഷം|ವರ್ಷ|বছর)"


def _domains(text: str) -> list[str]:
    lowered = text.casefold()
    rules = (
        ("Retail", ("shop", "store", "retail", "supermarket")),
        (
            "Software Development",
            (
                "software", "developer", "programming", "python", "java", "javascript",
                "typescript", "react", "html", "css", "node", "coding", "website",
                "web application", "backend", "frontend", "full stack", "fullstack",
            ),
        ),
        (
            "Data Analytics",
            (
                "data analysis", "data analytics", "analyse data", "analyze data",
                "pandas", "numpy", "power bi", "tableau", "excel",
            ),
        ),
        ("Machine Learning", ("machine learning", "deep learning", "ai models", "tensorflow", "pytorch")),
        (
            "Cloud Computing",
            (
                "cloud infrastructure", "cloud computing", "cloud deployment",
                "aws", "azure", "docker", "kubernetes", "linux",
            ),
        ),
    )
    return [domain for domain, markers in rules if any(marker in lowered for marker in markers)]


def _experience_years(text: str) -> float | None:
    lowered = text.casefold()
    match = re.search(r"\b(?:for|over|about|around)\s+(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\b", lowered)
    match = match or re.search(r"\b(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s+(?:of\s+)?experience\b", lowered)
    match = match or re.search(r"(\d+(?:\.\d+)?)\s*" + YEAR_MARKERS, lowered)
    if match:
        return float(match.group(1))
    word_pattern = "|".join(re.escape(word) for word in sorted(NUMBER_WORDS, key=len, reverse=True))
    match = re.search(r"\b(?:for|over|about|around)\s+(" + word_pattern + r")\s+years?\b", lowered)
    match = match or re.search(r"(" + word_pattern + r")\s*" + YEAR_MARKERS, lowered)
    if match:
        return float(NUMBER_WORDS[match.group(1)])
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
    for match in re.finditer(
        r"\b([A-Z]?[A-Za-z][A-Za-z0-9 +#./-]{0,40}\s+(?:developer|engineer|assistant|manager|analyst|designer|tester))\b",
        text,
        re.I,
    ):
        if any(cue in text.casefold() for cue in ("work", "worked", "working", "வேலை", "ஆக", "काम", "job")):
            candidate = match.group(1).strip()
            if "worked as" not in candidate.casefold():
                found.append(candidate.title())
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

TECH_SKILL_PATTERNS = (
    ("Python", r"\bpython\b"),
    ("Java", r"\bjava\b(?!\s*script)"),
    ("JavaScript", r"\bjavascript\b|\bjs\b"),
    ("TypeScript", r"\btypescript\b|\bts\b"),
    ("C++", r"\bc\+\+\b"),
    ("C", r"\bc\s+language\b|\bprogramming\s+in\s+c\b|\bc\s+programming\b"),
    ("HTML", r"\bhtml(?:5)?\b"),
    ("CSS", r"\bcss(?:3)?\b"),
    ("React", r"\breact(?:\.js|js)?\b"),
    ("Node.js", r"\bnode(?:\.js|js)?\b"),
    ("SQL", r"\bsql\b|\bstructured\s+query\s+language\b"),
    ("MySQL", r"\bmysql\b"),
    ("PostgreSQL", r"\bpostgres(?:ql)?\b"),
    ("MongoDB", r"\bmongo(?:db)?\b"),
    ("Pandas", r"\bpandas\b"),
    ("NumPy", r"\bnumpy\b"),
    ("Git", r"\bgit\b|\bgithub\b"),
    ("Docker", r"\bdocker\b"),
    ("Kubernetes", r"\bkubernetes\b|\bk8s\b"),
    ("AWS", r"\baws\b|\bamazon\s+web\s+services\b"),
    ("Azure", r"\bazure\b"),
    ("Linux", r"\blinux\b"),
    ("Android", r"\bandroid(?:\s+development)?\b"),
    ("Kotlin", r"\bkotlin\b"),
    ("Flutter", r"\bflutter\b"),
    ("Dart", r"\bdart\b"),
    ("Figma", r"\bfigma\b"),
    ("REST API", r"\brest(?:\s+api|ful\s+api)?\b|\bapi\s+development\b"),
    ("OOP", r"\boop\b|\bobject[\s-]oriented\b"),
    ("Data Structures", r"\bdata\s+structures?\b"),
    ("Algorithms", r"\balgorithms?\b"),
    ("Power BI", r"\bpower\s*bi\b"),
    ("Tableau", r"\btableau\b"),
    ("Microsoft Excel", r"\b(?:microsoft\s+)?excel\b"),
    ("C#", r"\bc#\b|\bc\s+sharp\b"),
    ("Go", r"\bgolang\b|\bgo\s+programming\b"),
    ("Rust", r"\brust\b|\brust\s+programming\b"),
    ("PHP", r"\bphp\b"),
    ("Angular", r"\bangular(?:\.js|js)?\b"),
    ("Vue.js", r"\bvue(?:\.js|js)?\b"),
    ("Express.js", r"\bexpress(?:\.js|js)?\b"),
    ("Firebase", r"\bfirebase\b"),
    ("GitHub", r"\bgithub\b"),
    ("Cisco", r"\bcisco\b"),
    ("TCP/IP", r"\btcp[\s/-]?ip\b"),
    ("AutoCAD", r"\bautocad\b"),
    ("Tally", r"\btally(?:\s+erp)?\b"),
    ("GST", r"\bgst\b"),
    ("Microsoft Office", r"\bmicrosoft\s+office\b|\bms\s+office\b"),
)

DIRECT_SKILL_PATTERNS = (
    ("Inventory Management", r"\b(?:manage|managed|managing)\s+(?:the\s+)?stock\b|\bstock\s+management\b|\b(?:handle|handling)\s+inventory\b|\binventory\s+(?:handling|management)\b|\bstock\s+manage\b"),
    ("Customer Handling", r"\b(?:handle|handled|handling|talk(?:ing)?\s+with)\s+(?:the\s+)?customers?\b|\bcustomers?[^\s]*\s+handle\b"),
    ("Data Analysis", r"\bdata\s+analysis\b|\bdata\s+analy[sz](?:e|ed|ing)\b|\banalyse\s+data\b|\banalyze\s+data\b"),
    ("Machine Learning", r"\bmachine\s+learning\b"),
    ("Deep Learning", r"\bdeep\s+learning\b"),
    ("Cloud Computing", r"\bcloud\s+(?:computing|infrastructure|deployment)\b"),
    ("Backend Development", r"\bbackend(?:\s+development)?\b|\bback[\s-]end(?:\s+development)?\b"),
    ("Frontend Development", r"\bfrontend(?:\s+development)?\b|\bfront[\s-]end(?:\s+development)?\b"),
    ("Full Stack Development", r"\bfull[\s-]stack(?:\s+development)?\b"),
    ("Cybersecurity", r"\bcyber\s*security\b|\bnetwork\s+security\b"),
    ("UI/UX Design", r"\bui[\s/-]?ux(?:\s+design)?\b"),
    ("Quality Control", r"\bquality\s+control\b|\bquality\s+inspection\b"),
    ("Software Testing", r"\bsoftware\s+testing\b|\bqa\s+testing\b|\bunit\s+testing\b"),
    ("Debugging", r"\bdebugging\b|\bcode\s+debugging\b"),
    ("Statistics", r"\bstatistics\b|\bstatistical\s+analysis\b"),
    ("Artificial Intelligence", r"\bartificial\s+intelligence\b"),
    ("Security Fundamentals", r"\bsecurity\s+fundamentals\b|\binformation\s+security\b"),
    ("Vulnerability Assessment", r"\bvulnerability\s+assessment\b|\bvulnerability\s+scanning\b"),
    ("Cryptography", r"\bcryptography\b|\bencryption\b"),
    ("Network Administration", r"\bnetwork\s+administration\b|\bnetwork\s+admin\b"),
    ("Prototyping", r"\bprototyping\b|\bwireframing\b"),
    ("User Research", r"\buser\s+research\b|\busability\s+testing\b"),
    ("Customer Service", r"\bcustomer\s+service\b|\bcustomer\s+support\b"),
    ("Digital Marketing", r"\bdigital\s+marketing\b|\bseo\b"),
    ("Data Entry", r"\bdata\s+entry\b"),
    ("Retail Operations", r"\bretail\s+operations\b"),
    ("Manufacturing", r"\bmanufacturing\b"),
    ("Electrical", r"\belectrical(?:\s+maintenance)?\b"),
    ("Mechanical", r"\bmechanical(?:\s+maintenance)?\b"),
    ("Machine Operation", r"\bmachine\s+operation\b|\boperating\s+machinery\b"),
    ("Logistics", r"\blogistics\b|\bsupply\s+chain\b"),
    ("Warehouse Management", r"\bwarehouse\s+management\b"),
    ("Accounting", r"\baccounting\b|\bbookkeeping\b"),
    ("Database Design", r"\bdatabase\s+design\b|\bschema\s+design\b"),
)

IMPLICIT_SKILL_PATTERNS = (
    ("Inventory Management", r"\bkeep\s+track\s+of\s+materials\s+coming\s+in\s+and\s+going\s+out\b"),
    ("Web Development", r"\bweb\s+application\s+develop(?:ed)?\b|\bwebsite\b|\bweb\s+application\b"),
    ("Database Management", r"\bdatabase-[\w\u0b80-\u0bff]*\s+manage\b|\bdatabase\s+(?:manage|managed|management|handling)\b|\bmanage(?:d)?\s+(?:a\s+)?database\b"),
)

CLAIM_CUES = (
    "use", "used", "using", "know", "learned", "built", "build", "created", "create", "develop", "worked", "working",
    "experience", "proficient", "familiar", "knowledge", "skilled", "skill", "skills", "background", "trained", "study", "studied",
    "hands-on", "working with", "worked with",
    "பயன்படுத்", "உருவாக்க", "வேலை", "பண்ண", "தெரியும்",
    "इस्तेमाल", "उपयोग", "बनाया", "काम", "जानता", "जानती",
    "ఉపయోగ", "రూపొంద", "పని", "తెలుసు",
    "உபயோக", "உண்டாக்க", "ஜோலி", "அறியாம்",
    "ಬಳ", "ಮಾಡ", "ಕೆಲಸ", "ಗೊತ್ತು",
    "ব্যবহার", "তৈরি", "কাজ", "জানি",
    "वापर", "तयार", "काम", "माहित",
)

NEGATION_CUES = (
    "don't know", "do not know", "dont know", "never used", "not used", "no experience",
    "தெரியாது", "பயன்படுத்தவில்லை", "இல்லை",
    "नहीं", "नही", "తెలియదు", "ಇಲ್ಲ", "അറിയില്ല", "জানি না", "नाही",
)


def _responsibilities(text: str) -> list[str]:
    return _unique(
        match.group(0).casefold()
        for pattern in RESPONSIBILITY_PATTERNS
        for match in re.finditer(pattern, text, re.I)
    )


def _has_claim_cue(sentence: str) -> bool:
    lowered = sentence.casefold()
    return any(cue in lowered for cue in CLAIM_CUES)


def _is_negated(sentence: str) -> bool:
    lowered = sentence.casefold()
    return any(cue in lowered for cue in NEGATION_CUES)


def _skills(text: str, sentences: list[str]) -> list[Skill]:
    found: list[Skill] = []
    for sentence in sentences:
        if not _has_claim_cue(sentence) or _is_negated(sentence):
            continue
        for canonical, pattern in TECH_SKILL_PATTERNS:
            for match in re.finditer(pattern, sentence, re.I):
                raw = match.group(0)
                found.append(Skill(
                    canonical_name=canonical,
                    raw_phrase=raw,
                    evidence=sentence,
                    confidence=0.95,
                    inference_type="explicit",
                ))
        for canonical, pattern in DIRECT_SKILL_PATTERNS:
            for match in re.finditer(pattern, sentence, re.I):
                raw = match.group(0)
                normalized = normalize_skill(raw) or canonical
                found.append(Skill(
                    canonical_name=normalized,
                    raw_phrase=raw,
                    evidence=sentence,
                    confidence=0.95 if normalized in {"Python", "SQL", "Java"} else 0.94,
                    inference_type="explicit",
                ))

    # Also check direct skills against the whole text if not found yet (with exact sentence evidence)
    for canonical, pattern in DIRECT_SKILL_PATTERNS:
        for match in re.finditer(pattern, text, re.I):
            raw = match.group(0)
            ev = _evidence(raw, sentences)
            if not _is_negated(ev):
                normalized = normalize_skill(raw) or canonical
                found.append(Skill(
                    canonical_name=normalized,
                    raw_phrase=raw,
                    evidence=ev,
                    confidence=0.95 if normalized in {"Python", "SQL", "Java"} else 0.94,
                    inference_type="explicit",
                ))

    for canonical, pattern in IMPLICIT_SKILL_PATTERNS:
        for match in re.finditer(pattern, text, re.I):
            raw = match.group(0)
            evidence = _evidence(raw, sentences)
            if _is_negated(evidence):
                continue
            if canonical == "Web Development" and "website" in raw.casefold() and not any(
                cue in evidence.casefold() for cue in ("build", "built", "create", "created", "develop", "உருவாக்க", "बनाया", "తయారు", "ತಯಾರ", "তৈரி")
            ):
                continue
            found.append(Skill(
                canonical_name=canonical, raw_phrase=raw, evidence=evidence,
                confidence=0.82 if canonical in {"Web Development", "Database Management"} else 0.76,
                inference_type="implicit",
            ))
    return normalize_skills(found)


def _source_contains(source: str, value: str) -> bool:
    return value.strip().casefold() in source


def _sanitize_profile(profile: ProfileResponse, transcript: str) -> ProfileResponse:
    """Keep only AI claims that can be grounded directly in the transcript."""
    fallback = deterministic_extract(transcript)
    source = transcript.casefold()
    verified_skills = [
        skill
        for skill in profile.skills
        if _source_contains(source, skill.evidence)
        and (_source_contains(source, skill.raw_phrase) or _source_contains(skill.evidence.casefold(), skill.raw_phrase))
        and not _is_negated(skill.evidence)
    ]
    grounded_roles = [role for role in profile.roles if _source_contains(source, role)]
    grounded_responsibilities = [
        responsibility for responsibility in profile.responsibilities if _source_contains(source, responsibility)
    ]
    domains = _unique(fallback.domain + [domain for domain in profile.domain if _source_contains(source, domain)])
    return ProfileResponse(
        domain=domains,
        experience_years=fallback.experience_years,
        roles=_unique(fallback.roles + grounded_roles),
        responsibilities=_unique(fallback.responsibilities + grounded_responsibilities),
        skills=normalize_skills(verified_skills + fallback.skills),
    )


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

    return _sanitize_profile(profile, transcript)


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
