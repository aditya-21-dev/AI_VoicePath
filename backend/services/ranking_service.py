import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from .filter_service import FilterService
except ImportError:
    from filter_service import FilterService

class RankingService:
    def __init__(self):
        # Weights MUST NOT BE CHANGED per Step 9 instructions
        self.weights = {
            "skill_similarity": 40.0,
            "experience_match": 20.0,
            "district_match": 15.0,
            "eligibility_match": 15.0,
            "interest_match": 10.0
        }
        self.filter_service = FilterService()

    def _calculate_experience_match(self, user_exp: int, opportunity: dict) -> float:
        """
        Score experience only when an explicit year-based requirement exists.
        Current demo opportunities do not include work-experience requirements,
        so they receive a neutral score instead of unsupported full credit.
        """
        requirement_text = " ".join(
            str(opportunity.get(field, ""))
            for field in (
                "Experience",
                "Experience_Required",
                "Minimum_Experience",
                "Min_Experience",
                "Requirements",
                "Eligibility",
            )
        )
        if "experience" not in requirement_text.lower():
            return 0.5

        match = re.search(r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)", requirement_text, re.IGNORECASE)
        if not match:
            return 0.5

        required_years = float(match.group(1))
        try:
            user_years = float(user_exp or 0)
        except (TypeError, ValueError):
            user_years = 0.0

        return 1.0 if user_years >= required_years else 0.0

    def _calculate_interest_match(self, user_interests: list, opportunity: dict) -> float:
        if not user_interests:
            return 0.5
        text_to_search = (opportunity.get("Course_Name", "") + " " + opportunity.get("Skill_Category", "")).lower()
        for interest in user_interests:
            if interest.lower() in text_to_search:
                return 1.0
        return 0.0

    def rank_opportunities(self, user_profile: dict, opportunities: list, skill_matches: list) -> list:
        """
        Ranks a list of opportunities based on the user's profile and pre-calculated skill matches.
        """
        ranked_results = []
        
        default_skill_data = {"skill_similarity": 0.0, "matched_skills": [], "missing_skills": []}
        skill_matches_by_id = {
            match["opportunity_id"]: match
            for match in skill_matches
            if isinstance(match, dict) and match.get("opportunity_id")
        }

        for index, opp in enumerate(opportunities):
            opportunity_id = opp.get("Opportunity_ID")
            skill_data = skill_matches_by_id.get(opportunity_id)
            if skill_data is None and index < len(skill_matches):
                positional_match = skill_matches[index]
                if not isinstance(positional_match, dict) or not positional_match.get("opportunity_id"):
                    skill_data = positional_match
            if not isinstance(skill_data, dict):
                skill_data = default_skill_data

            skill_sim = skill_data.get("skill_similarity", 0.0)
            exp_match = self._calculate_experience_match(user_profile.get("experience_years", 0), opp)
            
            # Use the new FilterService
            dist_res = self.filter_service.check_district(
                user_profile.get("district", ""), 
                user_profile.get("state", ""),
                opp.get("District", ""),
                opp.get("State", "")
            )
            dist_match = dist_res["score"]
            
            elig_res = self.filter_service.check_eligibility(user_profile, opp)
            elig_match = self.filter_service.get_eligibility_score(elig_res["eligibility_status"])
            
            int_match = self._calculate_interest_match(user_profile.get("interests", []), opp)
            
            # Calculate weighted scores
            breakdown = {
                "skill_similarity": round(skill_sim * self.weights["skill_similarity"], 2),
                "experience_match": round(exp_match * self.weights["experience_match"], 2),
                "district_match": round(dist_match * self.weights["district_match"], 2),
                "eligibility_match": round(elig_match * self.weights["eligibility_match"], 2),
                "interest_match": round(int_match * self.weights["interest_match"], 2)
            }
            
            total_score = sum(breakdown.values())
            breakdown["weighted_total"] = round(total_score, 2)
            
            ranked_results.append({
                "opportunity_id": opp.get("Opportunity_ID"),
                "title": opp.get("Course_Name"),
                "course_name": opp.get("Course_Name"),
                "district": opp.get("District"),
                "state": opp.get("State"),
                "type": opp.get("Type"),
                "source_url": opp.get("Source_URL"),
                "match_score": round(total_score, 2),
                "matched_skills": skill_data.get("matched_skills", []),
                "missing_skills": skill_data.get("missing_skills", []),
                "eligibility_status": elig_res["eligibility_status"],
                "match_breakdown": breakdown,
                "eligibility_info": elig_res,
                "district_info": dist_res
            })
            
        # Sort by match_score descending
        ranked_results.sort(key=lambda x: x["match_score"], reverse=True)
        return ranked_results
