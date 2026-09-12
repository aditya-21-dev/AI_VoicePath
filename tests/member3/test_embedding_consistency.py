import csv
import json
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT / "backend" / "services"))

DATA_DIR = PROJECT_ROOT / "data" / "demo"


def load_skills():
    with open(DATA_DIR / "skills.csv", "r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def load_embeddings():
    with open(DATA_DIR / "skill_embeddings.json", "r", encoding="utf-8") as f:
        return json.load(f)


def test_embedding_file_matches_skills_csv():
    skills = load_skills()
    embeddings = load_embeddings()

    assert len(skills) == 27
    assert len(embeddings) == len(skills)
    assert [row["skill_id"] for row in skills] == [row["skill_id"] for row in embeddings]
    assert [row["canonical_name"] for row in skills] == [row["canonical_name"] for row in embeddings]
    assert len({row["skill_id"] for row in skills}) == len(skills)
    assert len({row["skill_id"] for row in embeddings}) == len(embeddings)

    dimensions = {len(row["embedding"]) for row in embeddings}
    assert dimensions == {384}
    assert all(row["embedding"] for row in embeddings)


def test_generation_helpers_preserve_skill_order_and_text_inputs():
    from generate_skill_embeddings import build_embedding_text, validate_embedding_records

    skills = load_skills()
    embeddings = load_embeddings()

    assert build_embedding_text(skills[0]).startswith("Accounting bookkeeping")
    assert build_embedding_text(skills[-1]).startswith("Security Fundamentals")
    assert validate_embedding_records(skills, embeddings) == 384


if __name__ == "__main__":
    test_embedding_file_matches_skills_csv()
    test_generation_helpers_preserve_skill_order_and_text_inputs()
    print("Embedding validation passed: 27 skills, 27 embeddings, 384 dimensions, IDs/names consistent.")
