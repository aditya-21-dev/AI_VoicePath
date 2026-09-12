import csv
import os
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT / "backend" / "services"))

from ranking_service import RankingService


def base_opportunity(opportunity_id, course_name):
    return {
        "Opportunity_ID": opportunity_id,
        "Course_Name": course_name,
        "Skill_Category": "IT",
        "District": "Chennai",
        "State": "Tamil Nadu",
        "Eligibility": "graduate",
        "Type": "Training",
        "Source_URL": "https://example.com",
    }


def base_profile():
    return {
        "experience_years": 2,
        "district": "Chennai",
        "state": "Tamil Nadu",
        "eligibility": "graduate",
        "interests": ["IT"],
    }


def test_ranking_weights_are_unchanged():
    weights = RankingService().weights
    assert weights["skill_similarity"] == 40.0
    assert weights["experience_match"] == 20.0
    assert weights["district_match"] == 15.0
    assert weights["eligibility_match"] == 15.0
    assert weights["interest_match"] == 10.0


def test_missing_experience_requirement_is_neutral_not_full_credit():
    service = RankingService()
    assert service._calculate_experience_match(10, base_opportunity("A", "No Experience Field")) == 0.5


def test_explicit_experience_requirement_is_compared_to_user_experience():
    service = RankingService()
    opportunity = base_opportunity("A", "Experienced Role")
    opportunity["Experience"] = "Minimum 3 years experience required"

    assert service._calculate_experience_match(4, opportunity) == 1.0
    assert service._calculate_experience_match(2, opportunity) == 0.0


def test_ranker_retains_all_opportunities_when_skill_matches_are_missing_or_reordered():
    service = RankingService()
    opportunities = [
        base_opportunity("A", "First"),
        base_opportunity("B", "Second"),
        base_opportunity("C", "Third"),
    ]
    skill_matches = [
        {"opportunity_id": "C", "skill_similarity": 1.0, "matched_skills": ["Python"], "missing_skills": []},
        {"opportunity_id": "A", "skill_similarity": 0.25, "matched_skills": [], "missing_skills": ["Python"]},
    ]

    ranked = service.rank_opportunities(base_profile(), opportunities, skill_matches)
    ranked_ids = {row["opportunity_id"] for row in ranked}

    assert ranked_ids == {"A", "B", "C"}
    assert len(ranked) == len(opportunities)
    assert next(row for row in ranked if row["opportunity_id"] == "B")["match_breakdown"]["skill_similarity"] == 0.0
    assert ranked[0]["opportunity_id"] == "C"


def test_scores_sorted_in_range_and_existing_output_shape_is_preserved():
    service = RankingService()
    opportunities = [base_opportunity("A", "High Skill"), base_opportunity("B", "Low Skill")]
    skill_matches = [
        {"opportunity_id": "A", "skill_similarity": 1.0, "matched_skills": ["Python"], "missing_skills": []},
        {"opportunity_id": "B", "skill_similarity": 0.0, "matched_skills": [], "missing_skills": ["Python"]},
    ]

    ranked = service.rank_opportunities(base_profile(), opportunities, skill_matches)
    scores = [row["match_score"] for row in ranked]

    assert all(0 <= score <= 100 for score in scores)
    assert all(scores[index] >= scores[index + 1] for index in range(len(scores) - 1))
    assert ranked[0]["opportunity_id"] == "A"
    for row in ranked:
        assert "weighted_total" in row["match_breakdown"]
        assert "district_info" in row
        assert "eligibility_info" in row
        assert "source_url" in row


def test_current_demo_opportunities_all_rank_with_neutral_experience():
    service = RankingService()
    with open(PROJECT_ROOT / "data" / "demo" / "opportunities.csv", "r", encoding="utf-8", newline="") as f:
        opportunities = list(csv.DictReader(f))

    skill_matches = [
        {"opportunity_id": row["Opportunity_ID"], "skill_similarity": 0.0, "matched_skills": [], "missing_skills": []}
        for row in opportunities
    ]
    ranked = service.rank_opportunities(base_profile(), opportunities, skill_matches)

    assert len(ranked) == len(opportunities) == 10
    assert {row["match_breakdown"]["experience_match"] for row in ranked} == {10.0}


if __name__ == "__main__":
    test_ranking_weights_are_unchanged()
    test_missing_experience_requirement_is_neutral_not_full_credit()
    test_explicit_experience_requirement_is_compared_to_user_experience()
    test_ranker_retains_all_opportunities_when_skill_matches_are_missing_or_reordered()
    test_scores_sorted_in_range_and_existing_output_shape_is_preserved()
    test_current_demo_opportunities_all_rank_with_neutral_experience()
    print("Ranking regression validation passed: weights, experience scoring, ordering, and retention are correct.")
