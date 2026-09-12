"""Ranking service for ordering matched opportunities."""

from __future__ import annotations


def rank_opportunities(opportunities: list[dict]) -> list[dict]:
    """Rank opportunities by match score descending, then matched count."""
    return sorted(
        opportunities,
        key=lambda o: (
            o.get("match_score", 0.0),
            len(o.get("matched_skills", [])),
            -o.get("posted_days_ago", 99),
        ),
        reverse=True,
    )
