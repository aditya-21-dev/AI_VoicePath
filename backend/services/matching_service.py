"""Core opportunity matching engine.

Provides both:
- MatchingService: Member 3's class-based embedding/cosine-similarity matcher
  using sentence-transformers and pre-computed skill embeddings.
- match_skills_to_opportunities(): Functional pipeline used by main.py API
  that loads CSV opportunities, compares skills directly, and returns
  ranked + filtered results with explainable breakdown.
- load_opportunity_dataset(): Cached loader for the CSV data files.
"""

from __future__ import annotations

import csv
import json
import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

from backend.services.breakdown_service import calculate_breakdown
from backend.services.filter_service import filter_opportunities
from backend.services.ranking_service import rank_opportunities

# ─── Shared data path ─────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


# ─── Functional Pipeline (used by main.py /api/v1/match-opportunities) ────────

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
    Used by POST /api/v1/match-opportunities in main.py.
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

    # Apply district & domain filtering (Member 3 FilterService functional interface)
    filtered = filter_opportunities(matched_results, district=district, domain=domain)
    # Rank by match score descending (Member 3 RankingService functional interface)
    ranked = rank_opportunities(filtered)

    return ranked


# ─── Class-Based Interface (Member 3 embedding-based matcher) ─────────────────

try:
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    _NUMPY_AVAILABLE = True
except ImportError:
    _NUMPY_AVAILABLE = False

try:
    from .embedding_service import EmbeddingService
except ImportError:
    try:
        from embedding_service import EmbeddingService  # type: ignore
    except ImportError:
        EmbeddingService = None  # type: ignore


class MatchingService:
    """Embedding-based skill matcher using sentence-transformers cosine similarity.

    Requires: numpy, scikit-learn, sentence-transformers, and pre-computed
    skill_embeddings.json + opportunities.csv in data/demo/.
    """

    def __init__(self, embeddings_path: str = None, opportunities_path: str = None):
        if not _NUMPY_AVAILABLE:
            raise ImportError("numpy and scikit-learn are required for MatchingService.")
        if EmbeddingService is None:
            raise ImportError("embedding_service module is required for MatchingService.")

        project_root = Path(__file__).resolve().parents[2]
        demo_data_dir = project_root / "data" / "demo"
        if embeddings_path is None:
            embeddings_path = demo_data_dir / "skill_embeddings.json"
        if opportunities_path is None:
            opportunities_path = demo_data_dir / "opportunities.csv"

        self.embedding_service = EmbeddingService()

        with open(embeddings_path, "r", encoding="utf-8") as f:
            self.canonical_skills = json.load(f)

        self.canonical_embeddings = np.array([skill["embedding"] for skill in self.canonical_skills])

        self.opportunities = []
        with open(opportunities_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.opportunities.append(row)

    def extract_phrases(self, text: str) -> List[str]:
        """Naively splits natural language text into phrases to extract potential skills."""
        phrases = re.split(r'[.,;!?]|\band\b|\bor\b', text, flags=re.IGNORECASE)
        return [p.strip() for p in phrases if len(p.strip()) > 3]

    def match_user_skills(self, user_skills: List[str], similarity_threshold: float = 0.50) -> List[Dict[str, Any]]:
        """Embeds extracted user skills and finds the best canonical skill matches."""
        if not user_skills:
            return []

        user_embeddings = self.embedding_service.generate_embeddings(user_skills)
        user_embeddings_np = np.array(user_embeddings)

        similarities = cosine_similarity(user_embeddings_np, self.canonical_embeddings)

        matched_results = []
        for i, user_skill in enumerate(user_skills):
            best_match_idx = np.argmax(similarities[i])
            best_score = float(similarities[i][best_match_idx])

            if best_score >= similarity_threshold:
                matched_results.append({
                    "user_skill": user_skill,
                    "matched_canonical_skill": self.canonical_skills[best_match_idx]["canonical_name"],
                    "skill_id": self.canonical_skills[best_match_idx]["skill_id"],
                    "similarity_score": best_score
                })

        # Deduplicate: keep the highest-scoring match per canonical skill
        deduped = {}
        for match in matched_results:
            c_skill = match["matched_canonical_skill"]
            if c_skill not in deduped or match["similarity_score"] > deduped[c_skill]["similarity_score"]:
                deduped[c_skill] = match

        return list(deduped.values())

    def match_natural_language_profile(self, profile_text: str, similarity_threshold: float = 0.50) -> List[Dict[str, Any]]:
        """Helper to extract phrases from a text profile and match them to canonical skills."""
        phrases = self.extract_phrases(profile_text)
        return self.match_user_skills(phrases, similarity_threshold)

    def compare_skills_with_opportunity(self, user_matched_skills: List[Dict[str, Any]], opportunity: Dict[str, str]) -> Dict[str, Any]:
        """Compares a user's matched canonical skills against an opportunity's Required_Skills."""
        req_skills_raw = opportunity.get("Required_Skills", "")
        req_skills = [s.strip() for s in req_skills_raw.split(";") if s.strip()]

        user_canonical_names = {match["matched_canonical_skill"] for match in user_matched_skills}

        matched_skills = []
        missing_skills = []

        for req in req_skills:
            if req in user_canonical_names:
                matched_skills.append(req)
            else:
                missing_skills.append(req)

        total_req = len(req_skills)
        skill_similarity = len(matched_skills) / total_req if total_req > 0 else 0.0

        return {
            "opportunity_id": opportunity.get("Opportunity_ID"),
            "course_name": opportunity.get("Course_Name"),
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "skill_similarity": skill_similarity
        }
