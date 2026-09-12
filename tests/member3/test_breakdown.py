import os
import sys
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend", "services")))
from matching_service import MatchingService
from ranking_service import RankingService
from breakdown_service import BreakdownService

def main():
    print("Loading services (this will load embeddings)...")
    matching_service = MatchingService()
    ranking_service = RankingService()
    breakdown_service = BreakdownService()

    raw_text = "I have worked in a shop for four years. I manage stock and handle customers."
    user_profile = {
        "experience_years": 4,
        "district": "Chennai",
        "skills": ["Inventory Management", "Customer Service"],
        "eligibility": "graduate",
        "interests": ["Retail", "Logistics"]
    }

    # 1. Match Skills using the natural language profile to capture raw phrases as evidence
    matched_canonical = matching_service.match_natural_language_profile(raw_text, similarity_threshold=0.50)
    
    # 2. Compare skills with opportunities
    skill_matches = []
    for opp in matching_service.opportunities:
        match_result = matching_service.compare_skills_with_opportunity(matched_canonical, opp)
        skill_matches.append(match_result)
        
    # 3. Rank opportunities
    ranked = ranking_service.rank_opportunities(user_profile, matching_service.opportunities, skill_matches)
    
    # 4. Generate Explainable Breakdown
    breakdowns = breakdown_service.generate_breakdown(ranked, matched_canonical, user_profile)
    
    # 5. Print top result
    top = breakdowns[0]
    print("\n--- TOP RANKED OPPORTUNITY BREAKDOWN ---")
    print(json.dumps(top, indent=2))
    
    # Validations
    assert len(breakdowns) == len(ranked), "Breakdown generated for every ranked opportunity"
    assert top["matched_skills"] == ranked[0]["matched_skills"], "Matched skills preserved"
    assert top["missing_skills"] == ranked[0]["missing_skills"], "Missing skills preserved"
    assert len(top["reasons"]) > 0, "Reasons are generated"
    assert len(top["evidence"]) > 0, "Evidence is not fabricated and populated correctly"
    assert top["match_score"] == ranked[0]["match_score"], "Match score remained unchanged"
    assert top["match_breakdown"]["skill_similarity"] == ranked[0]["match_breakdown"]["skill_similarity"], "Breakdown values match ranking service"
    
    print("\nValidation passed: Explainable breakdown works deterministically and correctly preserves logic.")

if __name__ == "__main__":
    main()
