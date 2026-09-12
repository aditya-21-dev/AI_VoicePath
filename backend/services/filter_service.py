"""Filtering service for matched opportunities."""

from __future__ import annotations


def filter_opportunities(
    opportunities: list[dict],
    district: str | None = None,
    domain: str | None = None,
    min_score: float = 0.0,
) -> list[dict]:
    """Filter opportunity matches by district, domain, or threshold."""
    filtered = opportunities
    if district and district.lower() != "all":
        target = district.strip().lower()
        filtered = [
            o for o in filtered
            if target in o.get("district", "").lower() or target in o.get("location", "").lower()
        ]

    if domain and domain.lower() != "all":
        target_domain = domain.strip().lower()
        filtered = [
            o for o in filtered
            if target_domain in o.get("domain", "").lower()
        ]

    if min_score > 0.0:
        filtered = [o for o in filtered if o.get("match_score", 0.0) >= min_score]

    return filtered
