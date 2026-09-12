"""Explainable breakdown service for opportunity matching."""

from __future__ import annotations


def calculate_breakdown(
    matched_skills: list[str],
    required_skills: list[str],
    user_experience_years: float | None = None,
    user_district: str | None = None,
    opportunity_district: str | None = None,
) -> dict[str, float]:
    """Calculate granular scores for explainability breakdown."""
    total_req = max(len(required_skills), 1)
    matched_count = len(matched_skills)
    skill_similarity = round(min(matched_count / total_req, 1.0), 2)

    # Experience match: baseline reasonable tenure
    exp_years = user_experience_years or 1.0
    exp_score = round(min(0.70 + (min(exp_years, 5.0) / 5.0) * 0.25, 0.98), 2)

    # District eligibility
    if not user_district or user_district == "all":
        dist_score = 0.95
    else:
        dist_score = 1.0 if user_district.lower() in (opportunity_district or "").lower() else 0.75

    eligibility_score = 1.0 if skill_similarity >= 0.3 else 0.6

    return {
        "skill_similarity": skill_similarity,
        "experience_match": exp_score,
        "district_eligibility": dist_score,
        "eligibility_score": eligibility_score,
    }
