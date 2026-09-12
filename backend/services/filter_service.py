"""Filtering service for matched opportunities.

Provides both:
- FilterService: Member 3's rich class-based eligibility and district checking
  with detailed education level parsing and student status detection.
- filter_opportunities(): Functional interface used by the matching pipeline
  for lightweight district/domain/score filtering.
"""

from __future__ import annotations


# ─── Functional Interface (used by matching_service pipeline) ─────────────────

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


# ─── Class-Based Interface (Member 3 full eligibility + district checking) ────

class FilterService:
    def __init__(self):
        pass

    EDUCATION_LEVELS = {
        "10th pass": 10,
        "10th": 10,
        "sslc": 10,
        "12th pass": 12,
        "12th": 12,
        "hsc": 12,
        "graduate": 16,
        "graduation": 16,
        "degree": 16,
        "postgraduate": 18,
        "post graduate": 18,
        "masters": 18,
        "master's": 18,
    }

    NEGATIVE_PATTERNS = (
        "not a student",
        "not student",
        "not currently studying",
        "not studying",
        "not a graduate",
        "not graduate",
        "did not graduate",
        "no degree",
        "below 10th",
        "below tenth",
    )

    def check_district(self, user_district: str, user_state: str, opp_district: str, opp_state: str) -> dict:
        u_dist = (user_district or "").strip().lower()
        u_state = (user_state or "").strip().lower()
        o_dist = (opp_district or "").strip().lower()
        o_state = (opp_state or "").strip().lower()

        if not u_dist and not u_state:
            return {"score": 0.0, "reason": "User location unknown."}

        if not o_dist and not o_state:
            return {"score": 0.0, "reason": "Opportunity location unknown."}

        # Some opportunities use state name as district (statewide opportunities)
        if o_dist in ["all", u_state, "any", "tamil nadu"]:
            o_dist = u_dist

        if o_dist == u_dist and u_dist != "":
            return {"score": 1.0, "reason": "Exact district match."}

        if o_state == u_state and u_state != "":
            return {"score": 0.5, "reason": "Same state, different district."}

        return {"score": 0.0, "reason": "Different state."}

    def check_eligibility(self, user_profile: dict, opportunity: dict) -> dict:
        opp_elig = opportunity.get("Eligibility", "").strip()
        if not opp_elig or opp_elig.lower() in ["any", "none"]:
            return {
                "eligibility_status": "needs_verification",
                "eligibility_reason": "Opportunity does not specify clear eligibility criteria."
            }

        user_elig_info = self._build_user_eligibility_text(user_profile)
        if not user_elig_info:
            return {
                "eligibility_status": "needs_verification",
                "eligibility_reason": f"User profile lacks eligibility details. Requirement: '{opp_elig}'"
            }

        opp_text = self._normalize_text(opp_elig)
        user_text = self._normalize_text(user_elig_info)

        if self._has_explicit_contradiction(opp_text, user_text):
            return {
                "eligibility_status": "not_eligible",
                "eligibility_reason": f"User profile explicitly contradicts stated eligibility. Requirement: '{opp_elig}', User profile: '{user_elig_info}'."
            }

        required_education = self._extract_required_education_level(opp_text)
        user_education = self._extract_user_education_level(user_text)
        if required_education is not None:
            if user_education is None:
                return {
                    "eligibility_status": "needs_verification",
                    "eligibility_reason": f"User profile lacks education evidence for requirement: '{opp_elig}'"
                }
            if user_education >= required_education:
                return {
                    "eligibility_status": "eligible",
                    "eligibility_reason": "User profile explicitly satisfies the education requirement."
                }
            return {
                "eligibility_status": "not_eligible",
                "eligibility_reason": f"User education evidence is below the stated requirement. Requirement: '{opp_elig}', User profile: '{user_elig_info}'."
            }

        requires_student = "student" in opp_text or "students" in opp_text
        if requires_student:
            if self._has_student_evidence(user_text):
                return {
                    "eligibility_status": "eligible",
                    "eligibility_reason": "User profile explicitly indicates student status required by the opportunity."
                }
            return {
                "eligibility_status": "needs_verification",
                "eligibility_reason": f"Opportunity requires student status, but user profile does not provide explicit student evidence. Requirement: '{opp_elig}', User profile: '{user_elig_info}'."
            }

        if user_text in opp_text or opp_text in user_text:
            return {
                "eligibility_status": "eligible",
                "eligibility_reason": "User profile explicitly matches stated eligibility criteria."
            }

        return {
            "eligibility_status": "needs_verification",
            "eligibility_reason": f"Requires manual verification. Requirement: '{opp_elig}', User profile: '{user_elig_info}'."
        }

    def _build_user_eligibility_text(self, user_profile: dict) -> str:
        eligibility = user_profile.get("eligibility", "")
        if isinstance(eligibility, dict):
            values = [str(value) for value in eligibility.values() if value]
            return " ".join(values).strip()
        values = [str(eligibility).strip()]
        for field in ("education", "student_status"):
            value = user_profile.get(field)
            if value:
                values.append(str(value).strip())
        return " ".join(value for value in values if value).strip()

    def _normalize_text(self, text: str) -> str:
        return " ".join((text or "").lower().replace("&", " and ").split())

    def _has_explicit_contradiction(self, opp_text: str, user_text: str) -> bool:
        if "student" in opp_text and any(pattern in user_text for pattern in self.NEGATIVE_PATTERNS[:4]):
            return True
        if self._extract_required_education_level(opp_text) is not None:
            if any(pattern in user_text for pattern in self.NEGATIVE_PATTERNS[4:]):
                return True
        return False

    def _extract_required_education_level(self, text: str):
        matches = [
            level
            for phrase, level in self.EDUCATION_LEVELS.items()
            if phrase in text and not self._phrase_is_negated(text, phrase)
        ]
        return max(matches) if matches else None

    def _extract_user_education_level(self, text: str):
        matches = [
            level
            for phrase, level in self.EDUCATION_LEVELS.items()
            if phrase in text and not self._phrase_is_negated(text, phrase)
        ]
        return max(matches) if matches else None

    def _phrase_is_negated(self, text: str, phrase: str) -> bool:
        return f"not a {phrase}" in text or f"not {phrase}" in text or f"no {phrase}" in text

    def _has_student_evidence(self, text: str) -> bool:
        student_terms = (
            "student",
            "currently studying",
            "college student",
            "arts and science college",
            "arts science college",
        )
        return any(term in text for term in student_terms) and not any(
            pattern in text for pattern in self.NEGATIVE_PATTERNS[:4]
        )

    def get_eligibility_score(self, status: str) -> float:
        mapping = {
            "eligible": 1.0,
            "needs_verification": 0.5,
            "not_eligible": 0.0
        }
        return mapping.get(status, 0.0)
