import os
import sys
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend", "services")))
from filter_service import FilterService
from ranking_service import RankingService

def main():
    print("Testing FilterService & RankingService updates...")
    
    ranking_service = RankingService()
    
    user_profile = {
        "experience_years": 4,
        "district": "Chennai",
        "state": "Tamil Nadu",
        "skills": ["Inventory Management", "Customer Service"],
        "eligibility": "graduate",
        "interests": ["Retail", "Logistics"]
    }
    
    # Mock Opportunities
    opp_a = {
        "Opportunity_ID": "A",
        "Course_Name": "Local Chennai Course",
        "District": "Chennai",
        "State": "Tamil Nadu",
        "Eligibility": "must be a graduate"
    }
    opp_b = {
        "Opportunity_ID": "B",
        "Course_Name": "Madurai Course",
        "District": "Madurai",
        "State": "Tamil Nadu",
        "Eligibility": "requires 10th pass"
    }
    opp_c = {
        "Opportunity_ID": "C",
        "Course_Name": "Kerala Course",
        "District": "Kochi",
        "State": "Kerala",
        "Eligibility": "graduate"
    }
    opp_d = {
        "Opportunity_ID": "D",
        "Course_Name": "Unknown Eligibility Course",
        "District": "Chennai",
        "State": "Tamil Nadu",
        "Eligibility": "" 
    }
    
    mock_opps = [opp_a, opp_b, opp_c, opp_d]
    mock_skill_matches = [
        {"skill_similarity": 1.0, "matched_skills": [], "missing_skills": []},
        {"skill_similarity": 1.0, "matched_skills": [], "missing_skills": []},
        {"skill_similarity": 1.0, "matched_skills": [], "missing_skills": []},
        {"skill_similarity": 1.0, "matched_skills": [], "missing_skills": []}
    ]
    
    ranked = ranking_service.rank_opportunities(user_profile, mock_opps, mock_skill_matches)
    
    print("\n--- TEST FILTER & RANKING ---")
    for r in ranked:
        print(f"Opp {r['opportunity_id']} ({r['course_name']}) - Score: {r['match_score']}")
        print(f"  District Info: {r['district_info']}")
        print(f"  Eligibility Info: {r['eligibility_info']}")
        print(f"  Breakdown: {r['match_breakdown']}\n")
        
    # Validations
    opp_map = {r['opportunity_id']: r for r in ranked}
    
    assert opp_map["A"]["district_info"]["score"] == 1.0, "Opp A should be 1.0 district match"
    assert opp_map["A"]["eligibility_info"]["eligibility_status"] == "eligible", "Opp A should be eligible"
    assert opp_map["A"]["match_breakdown"]["district_match"] == 15.0
    assert opp_map["A"]["match_breakdown"]["eligibility_match"] == 15.0
    
    assert opp_map["B"]["district_info"]["score"] == 0.5, "Opp B should be 0.5 district match"
    assert opp_map["B"]["eligibility_info"]["eligibility_status"] == "eligible", "Opp B should be eligible because graduate evidence satisfies 10th pass"
    assert opp_map["B"]["match_breakdown"]["district_match"] == 7.5
    assert opp_map["B"]["match_breakdown"]["eligibility_match"] == 15.0
    
    assert opp_map["C"]["district_info"]["score"] == 0.0, "Opp C should be 0.0 district match"
    assert opp_map["C"]["match_breakdown"]["district_match"] == 0.0
    
    assert opp_map["D"]["eligibility_info"]["eligibility_status"] == "needs_verification", "Opp D should be needs_verification"
    assert opp_map["D"]["match_breakdown"]["eligibility_match"] == 7.5
    
    weights = ranking_service.weights
    assert weights["skill_similarity"] == 40.0
    assert weights["experience_match"] == 20.0
    assert weights["district_match"] == 15.0
    assert weights["eligibility_match"] == 15.0
    assert weights["interest_match"] == 10.0
    
    print("Validation passed: District and eligibility logic works as specified, and weights are unchanged.")

if __name__ == "__main__":
    main()
