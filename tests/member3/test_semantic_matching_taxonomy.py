import os
import sys


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend", "services"))

from matching_service import MatchingService


THRESHOLD = 0.50
CASES = [
    ("I manage stock", "Inventory Management"),
    ("I deal with customers", "Customer Service"),
    ("I do corporate accounting", "Accounting"),
    ("I file GST returns", "GST"),
    ("I create UI wireframes and prototypes", "Wireframing"),
    ("I write Python scripts", "Python"),
    ("I build machine learning models in Python", "Data Science"),
    ("I protect computers from cyber threats", "Cybersecurity"),
]


def test_semantic_matching_covers_current_taxonomy_categories():
    service = MatchingService()
    phrases = [phrase for phrase, _expected in CASES]
    matches = service.match_user_skills(phrases, similarity_threshold=THRESHOLD)
    by_phrase = {match["user_skill"]: match for match in matches}

    assert len(matches) == len(CASES)
    for phrase, expected in CASES:
        match = by_phrase[phrase]
        assert match["matched_canonical_skill"] == expected
        assert match["skill_id"].startswith("S")
        assert match["similarity_score"] >= THRESHOLD

    print("\nSemantic matching examples:")
    for phrase, expected in CASES:
        match = by_phrase[phrase]
        print(f"- {phrase} -> {expected} ({match['similarity_score']:.4f})")


def test_semantic_matching_deduplicates_to_best_canonical_match():
    service = MatchingService()
    matches = service.match_user_skills(
        ["I manage stock", "I handle inventory management"],
        similarity_threshold=THRESHOLD,
    )

    inventory_matches = [
        match for match in matches if match["matched_canonical_skill"] == "Inventory Management"
    ]
    assert len(inventory_matches) == 1


if __name__ == "__main__":
    test_semantic_matching_covers_current_taxonomy_categories()
    test_semantic_matching_deduplicates_to_best_canonical_match()
    print(f"Semantic matching validation passed: {len(CASES)} taxonomy cases passed at threshold {THRESHOLD}.")
