import os
import sys


sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend", "services")))

from breakdown_service import BreakdownService
from filter_service import FilterService
from ranking_service import RankingService


def test_explicit_student_eligibility_is_eligible():
    service = FilterService()
    opportunity = {"Eligibility": "Students in eligible Tamil Nadu Arts & Science colleges"}
    user_profile = {"eligibility": "college student in Tamil Nadu Arts and Science college"}

    result = service.check_eligibility(user_profile, opportunity)

    assert result["eligibility_status"] == "eligible"


def test_explicit_student_contradiction_is_not_eligible():
    service = FilterService()
    opportunity = {"Eligibility": "Students in eligible Tamil Nadu Arts & Science colleges"}
    user_profile = {"eligibility": "not a student"}

    result = service.check_eligibility(user_profile, opportunity)

    assert result["eligibility_status"] == "not_eligible"


def test_missing_user_eligibility_needs_verification():
    service = FilterService()
    opportunity = {"Eligibility": "Students in eligible Tamil Nadu Arts & Science colleges"}

    result = service.check_eligibility({}, opportunity)

    assert result["eligibility_status"] == "needs_verification"


def test_missing_opportunity_requirement_needs_verification():
    service = FilterService()
    result = service.check_eligibility({"eligibility": "student"}, {"Eligibility": ""})

    assert result["eligibility_status"] == "needs_verification"


def test_synthetic_education_fixture_supports_eligible_and_not_eligible():
    # TEST FIXTURE: the real demo CSV does not contain a structured education-only requirement.
    service = FilterService()
    opportunity = {"Eligibility": "Must be a graduate"}

    assert service.check_eligibility({"eligibility": "graduate"}, opportunity)["eligibility_status"] == "eligible"
    assert service.check_eligibility({"eligibility": "10th pass"}, opportunity)["eligibility_status"] == "not_eligible"


def test_ranking_scores_all_eligibility_states():
    ranking = RankingService()
    assert ranking.filter_service.get_eligibility_score("eligible") == 1.0
    assert ranking.filter_service.get_eligibility_score("needs_verification") == 0.5
    assert ranking.filter_service.get_eligibility_score("not_eligible") == 0.0

    base_opp = {
        "Opportunity_ID": "A",
        "Course_Name": "Student Course",
        "Skill_Category": "IT",
        "District": "Chennai",
        "State": "Tamil Nadu",
        "Eligibility": "Students only",
        "Type": "Training",
        "Source_URL": "https://example.com",
    }
    skill_matches = [{"opportunity_id": "A", "skill_similarity": 0.0, "matched_skills": [], "missing_skills": []}]
    eligible = ranking.rank_opportunities(
        {"district": "Chennai", "state": "Tamil Nadu", "eligibility": "student", "interests": []},
        [base_opp],
        skill_matches,
    )[0]
    not_eligible = ranking.rank_opportunities(
        {"district": "Chennai", "state": "Tamil Nadu", "eligibility": "not a student", "interests": []},
        [base_opp],
        skill_matches,
    )[0]
    needs_verification = ranking.rank_opportunities(
        {"district": "Chennai", "state": "Tamil Nadu", "eligibility": "", "interests": []},
        [base_opp],
        skill_matches,
    )[0]

    assert eligible["match_breakdown"]["eligibility_match"] == 15.0
    assert needs_verification["match_breakdown"]["eligibility_match"] == 7.5
    assert not_eligible["match_breakdown"]["eligibility_match"] == 0.0


def test_breakdown_explains_not_eligible_status():
    ranked = [{
        "opportunity_id": "A",
        "title": "Student Course",
        "course_name": "Student Course",
        "district": "Chennai",
        "type": "Training",
        "source_url": "https://example.com",
        "match_score": 25.0,
        "matched_skills": [],
        "missing_skills": [],
        "eligibility_info": {"eligibility_status": "not_eligible"},
        "district_info": {},
        "match_breakdown": {"eligibility_match": 0.0},
    }]

    breakdown = BreakdownService().generate_breakdown(ranked, [], {})[0]

    assert breakdown["eligibility_status"] == "not_eligible"
    assert "You do not meet the stated eligibility criteria." in breakdown["reasons"]


def main():
    test_explicit_student_eligibility_is_eligible()
    test_explicit_student_contradiction_is_not_eligible()
    test_missing_user_eligibility_needs_verification()
    test_missing_opportunity_requirement_needs_verification()
    test_synthetic_education_fixture_supports_eligible_and_not_eligible()
    test_ranking_scores_all_eligibility_states()
    test_breakdown_explains_not_eligible_status()
    print("Eligibility validation passed: eligible, needs_verification, and not_eligible are deterministic and ranked correctly.")


if __name__ == "__main__":
    main()
