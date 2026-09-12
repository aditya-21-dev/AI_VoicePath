"""Explainable breakdown service for opportunity matching.

Provides both:
- BreakdownService: Member 3's rich class-based explainable breakdown with evidence,
  eligibility, district match, and interest match reasons.
- calculate_breakdown(): Functional interface used by the matching pipeline
  for granular score calculation.
"""

from __future__ import annotations


# ─── Functional Interface (used by matching_service pipeline) ─────────────────

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


# ─── Class-Based Interface (Member 3 full explainable breakdown) ──────────────

class BreakdownService:
    def __init__(self):
        pass

    def generate_breakdown(self, ranked_opportunities: list, matched_canonical_skills: list, user_profile: dict) -> list:
        # Create a mapping of canonical skill to the raw user phrase (evidence)
        canonical_to_evidence = {}
        for match in matched_canonical_skills:
            c_skill = match.get("matched_canonical_skill")
            phrase = match.get("user_skill")

            if c_skill not in canonical_to_evidence:
                canonical_to_evidence[c_skill] = []
            if phrase not in canonical_to_evidence[c_skill]:
                canonical_to_evidence[c_skill].append(phrase)

        breakdowns = []
        for ranked_opp in ranked_opportunities:
            reasons = []
            evidence = []

            # 1. Matched Skills Reasons & Evidence
            matched_skills = ranked_opp.get("matched_skills", [])
            for skill in matched_skills:
                reasons.append(f"You have experience in {skill}.")
                if skill in canonical_to_evidence:
                    for phrase in canonical_to_evidence[skill]:
                        if phrase not in evidence:
                            evidence.append(phrase)

            # 2. Missing Skills Reasons
            missing_skills = ranked_opp.get("missing_skills", [])
            for skill in missing_skills:
                reasons.append(f"You are missing {skill}.")

            # 3. Match Breakdown Reasons
            bd = ranked_opp.get("match_breakdown", {})
            if bd.get("district_match", 0) > 0:
                reasons.append("Your location matches the opportunity.")

            eligibility_info = ranked_opp.get("eligibility_info", {})
            eligibility_status = eligibility_info.get("eligibility_status")
            if eligibility_status == "eligible":
                reasons.append("You meet the basic eligibility criteria.")
            elif eligibility_status == "needs_verification":
                reasons.append("Your eligibility needs verification.")
            elif eligibility_status == "not_eligible":
                reasons.append("You do not meet the stated eligibility criteria.")

            if bd.get("interest_match", 0) > 0:
                reasons.append("This aligns with your interests.")

            breakdown_obj = {
                "opportunity_id": ranked_opp.get("opportunity_id"),
                "title": ranked_opp.get("title"),
                "course_name": ranked_opp.get("course_name"),
                "district": ranked_opp.get("district"),
                "type": ranked_opp.get("type"),
                "source_url": ranked_opp.get("source_url"),
                "match_score": ranked_opp.get("match_score"),
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "eligibility_status": eligibility_status,
                "match_breakdown": {
                    "skill_similarity": bd.get("skill_similarity", 0),
                    "experience_match": bd.get("experience_match", 0),
                    "district_match": bd.get("district_match", 0),
                    "eligibility_match": bd.get("eligibility_match", 0),
                    "interest_match": bd.get("interest_match", 0)
                },
                "district_info": ranked_opp.get("district_info", {}),
                "eligibility_info": eligibility_info,
                "reasons": reasons,
                "evidence": evidence
            }
            breakdowns.append(breakdown_obj)

        return breakdowns
