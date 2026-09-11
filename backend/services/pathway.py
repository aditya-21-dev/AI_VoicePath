import re
from dataclasses import dataclass
from typing import Iterable

from backend.schemas.pathway import (
    LearningPathResponse,
    LearningPathStep,
    Skill,
    SkillGapResponse,
    WhatIfResponse,
)
from backend.utils.errors import VoicePathError


_WHITESPACE = re.compile(r"\s+")


@dataclass(frozen=True)
class NormalizedSkill:
    key: str
    display: str


def _skill_name(skill: str | Skill | NormalizedSkill) -> str:
    if isinstance(skill, NormalizedSkill):
        return skill.display
    if isinstance(skill, Skill):
        return skill.canonical_name
    return skill


def normalize_skill_name(name: str | None) -> NormalizedSkill | None:
    if name is None:
        return None
    display = _WHITESPACE.sub(" ", name.strip())
    if not display:
        return None
    return NormalizedSkill(key=display.casefold(), display=display)


def normalize_skill_list(skills: Iterable[str | Skill | NormalizedSkill] | None) -> list[NormalizedSkill]:
    deduped: dict[str, NormalizedSkill] = {}
    for skill in skills or []:
        normalized = normalize_skill_name(_skill_name(skill))
        if normalized and normalized.key not in deduped:
            deduped[normalized.key] = normalized
    return list(deduped.values())


def calculate_skill_gap(
    current_skills: Iterable[str | Skill] | None,
    required_skills: Iterable[str | Skill] | None,
) -> SkillGapResponse:
    current = normalize_skill_list(current_skills)
    required = normalize_skill_list(required_skills)

    if not required:
        raise VoicePathError(
            "MISSING_REQUIRED_SKILLS",
            "At least one required skill is needed to calculate a skill gap.",
            status_code=400,
        )

    current_keys = {skill.key for skill in current}
    matched = [skill.display for skill in required if skill.key in current_keys]
    missing = [skill.display for skill in required if skill.key not in current_keys]

    return SkillGapResponse(
        current_skills=[skill.display for skill in current],
        required_skills=[skill.display for skill in required],
        missing_skills=missing,
        matched_skills=matched,
    )


def generate_learning_path(missing_skills: Iterable[str | Skill] | None) -> LearningPathResponse:
    missing = normalize_skill_list(missing_skills)
    if not missing:
        return LearningPathResponse(
            learning_path=[],
            no_gap_message="No skill gaps were found, so no learning path is required.",
        )

    steps: list[LearningPathStep] = []
    for index, skill in enumerate(missing, start=1):
        title = f"Learn {skill.display}"
        description = (
            f"Build practical understanding of {skill.display} with a short demo activity. "
            "This placeholder step is derived directly from the identified skill gap."
        )
        steps.append(
            LearningPathStep(
                step=index,
                skill=skill.display,
                title=title,
                description=description,
                source_url=None,
                source_type="placeholder",
            )
        )

    if len(steps) > 1:
        steps.append(
            LearningPathStep(
                step=len(steps) + 1,
                skill=", ".join(skill.display for skill in missing),
                title="Practice the missing skills together",
                description=(
                    "Complete a combined practice task that uses the missing skills in the context "
                    "of the target opportunity. This is demo guidance until verified resources exist."
                ),
                source_url=None,
                source_type="demo",
            )
        )

    return LearningPathResponse(learning_path=steps)


def _readiness(current_skills: Iterable[str | Skill] | None, required_skills: Iterable[str | Skill] | None) -> float:
    gap = calculate_skill_gap(current_skills, required_skills)
    if not gap.required_skills:
        return 0.0
    score = len(gap.matched_skills) / len(gap.required_skills) * 100
    return round(score, 2)


def simulate_what_if(
    current_skills: Iterable[str | Skill] | None,
    required_skills: Iterable[str | Skill] | None,
    added_skills: Iterable[str | Skill] | None,
) -> WhatIfResponse:
    added = normalize_skill_list(added_skills)
    if not added:
        raise VoicePathError(
            "MISSING_ADDED_SKILLS",
            "At least one added skill is needed for a what-if projection.",
            status_code=400,
        )

    current = normalize_skill_list(current_skills)
    combined = current + added

    return WhatIfResponse(
        current_readiness=_readiness(current, required_skills),
        projected_readiness=_readiness(combined, required_skills),
        added_skills=[skill.display for skill in added],
    )
