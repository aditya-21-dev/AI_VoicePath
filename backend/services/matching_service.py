import csv
import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

try:
    from .embedding_service import EmbeddingService
except ImportError:
    from embedding_service import EmbeddingService

class MatchingService:
    def __init__(self, embeddings_path: str = None, opportunities_path: str = None):
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
        """
        Naively splits natural language text into phrases to extract potential skills.
        """
        phrases = re.split(r'[.,;!?]|\band\b|\bor\b', text, flags=re.IGNORECASE)
        return [p.strip() for p in phrases if len(p.strip()) > 3]

    def match_user_skills(self, user_skills: List[str], similarity_threshold: float = 0.50) -> List[Dict[str, Any]]:
        """
        Embeds extracted user skills and finds the best canonical skill matches.
        """
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
                
        # Deduplicate: if multiple user skills map to the same canonical skill, keep the one with higher score
        deduped = {}
        for match in matched_results:
            c_skill = match["matched_canonical_skill"]
            if c_skill not in deduped or match["similarity_score"] > deduped[c_skill]["similarity_score"]:
                deduped[c_skill] = match
                
        return list(deduped.values())
        
    def match_natural_language_profile(self, profile_text: str, similarity_threshold: float = 0.50) -> List[Dict[str, Any]]:
        """
        Helper to extract phrases from a text profile and match them to canonical skills.
        """
        phrases = self.extract_phrases(profile_text)
        return self.match_user_skills(phrases, similarity_threshold)

    def compare_skills_with_opportunity(self, user_matched_skills: List[Dict[str, Any]], opportunity: Dict[str, str]) -> Dict[str, Any]:
        """
        Compares a user's matched canonical skills against an opportunity's Required_Skills.
        """
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
