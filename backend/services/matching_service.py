"""Core opportunity matching engine connecting real extracted skills to opportunities."""

from __future__ import annotations

import csv
from functools import lru_cache
from pathlib import Path

from backend.services.breakdown_service import calculate_breakdown
from backend.services.filter_service import filter_opportunities
from backend.services.ranking_service import rank_opportunities

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


@lru_cache(maxsize=1)
def load_opportunity_dataset() -> tuple[list[dict], dict[str, list[str]]]:
    """Load opportunities and opportunity-skill mappings from CSV data files."""
    opps_file = DATA_DIR / "opportunities.csv"
    mapping_file = DATA_DIR / "opportunity_skill_mapping.csv"

    mappings: dict[str, list[str]] = {}
    if mapping_file.is_file():
        with open(mapping_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                opp_id = row["opportunity_id"]
                skill = row["skill_canonical_name"]
                mappings.setdefault(opp_id, []).append(skill)

    opportunities: list[dict] = []
    if opps_file.is_file():
        with open(opps_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                badges = [b.strip() for b in row.get("badges", "").split(";") if b.strip()]
                opportunities.append({
                    "id": row["id"],
                    "opportunity_id": row["id"],
                    "title": row["title"],
                    "company": row["company"],
                    "domain": row["domain"],
                    "district": row["district"],
                    "location": row["location"],
                    "salary_range": row["salary_range"],
                    "lat": float(row["lat"]) if row.get("lat") else 13.0827,
                    "lng": float(row["lng"]) if row.get("lng") else 80.2707,
                    "source_label": row.get("source_label", "National Career Service (NCS) Portal"),
                    "source_url": row.get("source_url", "https://www.ncs.gov.in"),
                    "description": row.get("description", ""),
                    "badges": badges or ["Verified Employer", "District Eligible"],
                    "posted_days_ago": int(row.get("posted_days_ago", 1)),
                    "required_skills": mappings.get(row["id"], []),
                })

    return opportunities, mappings


def match_skills_to_opportunities(
    user_skills: list[str],
    user_experience_years: float | None = None,
    district: str | None = None,
    domain: str | None = None,
) -> list[dict]:
    """Compare user's actual extracted canonical skills against opportunities.

    Calculates real match_score, matched_skills, missing_skills, and breakdown.
    """
    opportunities, _ = load_opportunity_dataset()
    user_skills_set = {s.strip().casefold() for s in user_skills if s and s.strip()}

    matched_results: list[dict] = []

    for opp in opportunities:
        req_skills = opp.get("required_skills", [])
        matched: list[str] = []
        missing: list[str] = []

        for req in req_skills:
            if req.casefold() in user_skills_set:
                matched.append(req)
            else:
                missing.append(req)

        total_req = max(len(req_skills), 1)
        match_score = round(min(len(matched) / total_req, 1.0), 2)

        # Explainable why_matched sentence
        if matched:
            matched_str = " and ".join(matched[:2])
            why_matched = (
                f"Your verified experience in {matched_str} satisfies "
                f"{len(matched)} of {total_req} core skill requirements for this role."
            )
        else:
            why_matched = f"Entry pathway for {opp['title']}; training provided for foundational skills."

        breakdown = calculate_breakdown(
            matched_skills=matched,
            required_skills=req_skills,
            user_experience_years=user_experience_years,
            user_district=district,
            opportunity_district=opp.get("district"),
        )

        eligibility_str = f"{int(match_score * 100)}% Match" if match_score >= 0.5 else "Eligible with Upskilling"

        matched_results.append({
            **opp,
            "match_score": match_score,
            "eligibility": eligibility_str,
            "is_eligible": match_score >= 0.25,
            "matched_skills": matched,
            "missing_skills": missing,
            "why_matched": why_matched,
            "breakdown": breakdown,
        })

    # Apply district & domain filtering
    filtered = filter_opportunities(matched_results, district=district, domain=domain)
    # Rank by match score descending
    ranked = rank_opportunities(filtered)

    return ranked
