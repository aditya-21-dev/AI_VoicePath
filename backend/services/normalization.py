"""Conservative deterministic skill normalization.

No shared data/skills.csv taxonomy exists in this repository yet. This small
ruleset is deliberately narrow: unknown phrases are never mapped to a skill.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from backend.schemas.profile import Skill


@dataclass(frozen=True)
class SkillRule:
    canonical_name: str
    patterns: tuple[str, ...]


SKILL_RULES: tuple[SkillRule, ...] = (
    SkillRule("Inventory Management", (
        r"\b(?:manage|managed|managing)\s+(?:the\s+)?stock\b",
        r"\bstock\s+management\b",
        r"\b(?:handle|handling)\s+inventory\b",
        r"\binventory\s+(?:handling|management)\b",
        r"\bstock\s+manage\b",
        r"\bkeep\s+track\s+of\s+materials\s+coming\s+in\s+and\s+going\s+out\b",
    )),
    SkillRule("Customer Handling", (
        r"\b(?:handle|handled|handling|talk(?:ing)?\s+with)\s+(?:the\s+)?customers?\b",
        r"\bcustomers?[^\s]*\s+handle\b",
    )),
    SkillRule("Python", (r"\bpython(?:\s+programming)?\b", r"\bcoding\s+in\s+python\b")),
    SkillRule("SQL", (r"\bsql\b", r"\bstructured\s+query\s+language\b")),
    SkillRule("Data Analysis", (r"\bdata\s+analysis\b|\bdata\s+analy[sz](?:e|ed|ing)\b",)),
    SkillRule("Machine Learning", (r"\bmachine\s+learning\b",)),
    SkillRule("Cloud Computing", (r"\bcloud\s+(?:computing|infrastructure|deployment)\b",)),
)


def normalize_skill(raw_phrase: str) -> str | None:
    """Return a canonical name only for a supported equivalent phrase."""
    for rule in SKILL_RULES:
        if any(re.search(pattern, raw_phrase, re.IGNORECASE) for pattern in rule.patterns):
            return rule.canonical_name
    return None


def normalize_skills(skills: list[Skill]) -> list[Skill]:
    """Normalize known phrases and remove only exact duplicate evidence."""
    result: list[Skill] = []
    seen: set[tuple[str, str]] = set()
    for skill in skills:
        canonical = normalize_skill(skill.raw_phrase) or skill.canonical_name.strip()
        key = (canonical.casefold(), skill.evidence.casefold())
        if key not in seen:
            seen.add(key)
            result.append(skill.model_copy(update={"canonical_name": canonical}))
    return result
