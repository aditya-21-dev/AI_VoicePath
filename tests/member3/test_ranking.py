import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend", "services")))
from matching_service import MatchingService
from ranking_service import RankingService

def main():
    print("Loading services (this will load embeddings)...")
    matching_service = MatchingService()
    ranking_service = RankingService()

    user_profile = {
        "experience_years": 4,
        "district": "Chennai",
        "skills": ["Inventory Management", "Customer Service"],
        "eligibility": "graduate",
        "interests": ["Retail", "Logistics"]
    }

    print(f"\nUser Profile: {user_profile}")
    
    # 1. Match Skills
    # Pass user skills through semantic matcher to canonicalize them
    matched_canonical = matching_service.match_user_skills(user_profile["skills"], similarity_threshold=0.50)
    
    # 2. Compare skills with opportunities
    skill_matches = []
    for opp in matching_service.opportunities:
        match_result = matching_service.compare_skills_with_opportunity(matched_canonical, opp)
        skill_matches.append(match_result)
        
    # 3. Rank opportunities
    ranked = ranking_service.rank_opportunities(user_profile, matching_service.opportunities, skill_matches)
    
    # 4. Print results
    print(f"\nTotal Opportunities Scored: {len(ranked)}")
    print("-" * 50)
    for i, r in enumerate(ranked):
        print(f"#{i+1} {r['course_name']} ({r['opportunity_id']}) - Score: {r['match_score']}/100")
        print(f"   Matched Skills: {r['matched_skills']}")
        print(f"   Missing Skills: {r['missing_skills']}")
        print(f"   Breakdown: {r['match_breakdown']}")
        print()
        
    # Validations
    assert len(ranked) > 0, "Should rank multiple opportunities"
    assert all(0 <= r["match_score"] <= 100 for r in ranked), "Scores must be between 0 and 100"
    assert all("weighted_total" in r["match_breakdown"] for r in ranked), "Weighted components must be visible"
    
    scores = [r["match_score"] for r in ranked]
    assert all(scores[i] >= scores[i+1] for i in range(len(scores)-1)), "Opportunities must be sorted highest to lowest"
    
    print("Validation passed: Scores are valid, weighted components are visible, and properly sorted.")

if __name__ == "__main__":
    main()
