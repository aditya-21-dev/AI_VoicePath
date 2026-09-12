"""Pydantic models for the locked Member 2 handoff."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator


class Skill(BaseModel):
    canonical_name: str = Field(min_length=1)
    raw_phrase: str = Field(min_length=1)
    evidence: str = Field(min_length=1)
    confidence: float = Field(ge=0, le=1)
    inference_type: Literal["explicit", "implicit"]

    @field_validator("canonical_name", "raw_phrase", "evidence")
    @classmethod
    def required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value


class ProfileResponse(BaseModel):
    domain: list[str] = Field(default_factory=list)
    experience_years: float | None = Field(default=None, ge=0)
    roles: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    skills: list[Skill] = Field(default_factory=list)


class ExtractProfileRequest(BaseModel):
    transcript: str = Field(min_length=1, max_length=20_000)

    @field_validator("transcript")
    @classmethod
    def non_blank_transcript(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("transcript must not be blank")
        return value


class TranscriptionResponse(BaseModel):
    transcript: str = Field(min_length=1)
    language: str = Field(min_length=1)
    confidence: float = Field(ge=0, le=1)
    translation: str | None = None


class MatchOpportunitiesRequest(BaseModel):
    skills: list[str] = Field(default_factory=list)
    experience_years: float | None = None
    district: str | None = None
    domain: str | None = None
