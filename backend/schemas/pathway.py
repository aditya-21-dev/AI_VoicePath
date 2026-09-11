from typing import Annotated, Literal

from pydantic import BaseModel, Field


class Skill(BaseModel):
    canonical_name: str = Field(..., min_length=1)
    raw_phrase: str | None = None
    evidence: list[str] = Field(default_factory=list)
    confidence: float | None = Field(default=None, ge=0, le=1)
    inference_type: str | None = None


SkillInput = Annotated[str | Skill, Field(union_mode="left_to_right")]


class SkillGapRequest(BaseModel):
    current_skills: list[SkillInput] = Field(default_factory=list)
    required_skills: list[SkillInput]


class SkillGapResponse(BaseModel):
    current_skills: list[str]
    required_skills: list[str]
    missing_skills: list[str]
    matched_skills: list[str]


class LearningPathStep(BaseModel):
    step: int
    skill: str
    title: str
    description: str
    source_url: str | None = None
    source_type: Literal["verified", "mock", "demo", "placeholder"] = "placeholder"


class LearningPathRequest(BaseModel):
    missing_skills: list[SkillInput] = Field(default_factory=list)
    current_skills: list[SkillInput] = Field(default_factory=list)
    required_skills: list[SkillInput] = Field(default_factory=list)


class LearningPathResponse(BaseModel):
    learning_path: list[LearningPathStep]
    no_gap_message: str | None = None


class WhatIfRequest(BaseModel):
    current_skills: list[SkillInput] = Field(default_factory=list)
    required_skills: list[SkillInput]
    added_skills: list[SkillInput]


class WhatIfResponse(BaseModel):
    current_readiness: float
    projected_readiness: float
    added_skills: list[str]
    projection_label: str = "VoicePath Projection"
    disclaimer: str = "This is a prototype projection and is not an official government score."
    formula: str = "readiness = matched required skills / required skills * 100"


class OpportunityMatchInput(BaseModel):
    opportunity_id: str | None = None
    title: str | None = None
    match_score: float | None = None
    district: str | None = None
    type: str | None = None
    matched_skills: list[SkillInput] = Field(default_factory=list)
    missing_skills: list[SkillInput] = Field(default_factory=list)
    eligibility_status: str | None = None
    reasons: list[str] = Field(default_factory=list)
    evidence: list[str] = Field(default_factory=list)
    source_url: str | None = None
    required_skills: list[SkillInput] = Field(default_factory=list)


class AnalyzeRequest(BaseModel):
    current_skills: list[SkillInput] = Field(default_factory=list)
    required_skills: list[SkillInput] = Field(default_factory=list)
    opportunity: OpportunityMatchInput | None = None
    added_skills: list[SkillInput] = Field(default_factory=list)


class AnalyzeResponse(BaseModel):
    skill_gap: SkillGapResponse
    learning_path: LearningPathResponse
    what_if: WhatIfResponse | None = None
    opportunity: OpportunityMatchInput | None = None
