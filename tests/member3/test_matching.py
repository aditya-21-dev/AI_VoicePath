import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend", "services")))
from matching_service import MatchingService

def main():
    print("Initializing MatchingService (this will load the embedding model)...")
    service = MatchingService()
    
    test_profile = "I have worked in a shop for four years. I manage stock and handle customers."
    print(f"\n--- TEST PROFILE ---\n{test_profile}\n--------------------")
    
    print("\nExtracting and matching skills...")
    matched_skills = service.match_natural_language_profile(test_profile, similarity_threshold=0.50)
    
    print(f"\nDetected {len(matched_skills)} matched canonical skills:")
    for match in matched_skills:
        print(f"- '{match['user_skill']}' -> {match['matched_canonical_skill']} (Score: {match['similarity_score']:.4f})")
        
    print("\nComparing matched skills against all opportunities...")
    print("--------------------------------------------------")
    for opp in service.opportunities:
        result = service.compare_skills_with_opportunity(matched_skills, opp)
        if result["skill_similarity"] > 0:
            print(f"Opportunity: {result['course_name']} ({result['opportunity_id']})")
            print(f"  Matched: {result['matched_skills']}")
            print(f"  Missing: {result['missing_skills']}")
            print(f"  Skill Similarity: {result['skill_similarity']:.2f}")
            print()
            
    # Simple validation for test assertions
    canonical_names_found = [m["matched_canonical_skill"] for m in matched_skills]
    
    test_passed = True
    if "Inventory Management" not in canonical_names_found:
        print("ERROR: Did not detect 'Inventory Management'")
        test_passed = False
    if "Customer Service" not in canonical_names_found:
        print("ERROR: Did not detect 'Customer Service'")
        test_passed = False
        
    print("\n===============================")
    if test_passed:
        print("TEST PASSED: Core skills identified successfully!")
    else:
        print("TEST FAILED: Some core skills were missed.")

if __name__ == "__main__":
    main()
