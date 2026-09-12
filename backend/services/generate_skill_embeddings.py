import csv
import json
import os
import sys
import argparse
from pathlib import Path

# Ensure backend directory is in path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from embedding_service import EmbeddingService


def load_skills(skills_csv: Path) -> list[dict[str, str]]:
    with open(skills_csv, "r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def build_embedding_text(skill: dict[str, str]) -> str:
    return f"{skill['canonical_name']} {skill.get('aliases', '')}".strip()


def validate_embedding_records(skills: list[dict[str, str]], records: list[dict]) -> int:
    assert len(records) == len(skills), f"Expected {len(skills)} embeddings, got {len(records)}"

    skill_ids = [record["skill_id"] for record in records]
    assert len(set(skill_ids)) == len(records), "Duplicate skill_ids found in embeddings"

    canonical_names = [record["canonical_name"] for record in records]
    assert len(set(canonical_names)) == len(records), "Duplicate canonical names found in embeddings"

    expected_ids = [skill["skill_id"] for skill in skills]
    expected_names = [skill["canonical_name"] for skill in skills]
    assert skill_ids == expected_ids, "Embedding skill_ids do not match skills.csv order"
    assert canonical_names == expected_names, "Embedding canonical names do not match skills.csv order"

    dim = len(records[0]["embedding"])
    for record in records:
        embedding = record["embedding"]
        assert len(embedding) == dim, f"Inconsistent embedding dimensions: expected {dim}, got {len(embedding)}"
        assert dim > 0, "Empty embedding found"
    return dim


def generate_embedding_records(skills: list[dict[str, str]], service: EmbeddingService) -> list[dict]:
    texts = [build_embedding_text(skill) for skill in skills]
    embeddings = service.generate_embeddings(texts)

    return [
        {
            "skill_id": skill["skill_id"],
            "canonical_name": skill["canonical_name"],
            "embedding": embedding,
        }
        for skill, embedding in zip(skills, embeddings)
    ]


def main():
    parser = argparse.ArgumentParser(description="Generate canonical skill embeddings.")
    parser.add_argument("--dry-run", action="store_true", help="Generate and validate embeddings without writing output.")
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parents[2]
    demo_data_dir = project_root / "data" / "demo"
    skills_csv = demo_data_dir / "skills.csv"
    output_json = demo_data_dir / "skill_embeddings.json"
    
    print("Loading embedding model (this may download model weights the first time)...")
    service = EmbeddingService()
    
    skills = load_skills(skills_csv)
            
    if not skills:
        print("No skills found in skills.csv")
        return
        
    print(f"Found {len(skills)} skills. Generating embeddings...")
    
    results = generate_embedding_records(skills, service)
    dim = validate_embedding_records(skills, results)

    if args.dry_run:
        print("\nDry run complete. Existing embedding file was not modified.")
    else:
        with open(output_json, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        print(f"\nSuccessfully saved embeddings to {output_json}")
        
    print("\n--- Validation Results ---")
    print("1. Embeddings equal skills:", len(results) == len(skills))
    print("2. Unique skill_ids:", len({r["skill_id"] for r in results}) == len(results))
    print("3. Consistent dimension:", dim)
    print("4. No empty embeddings: True")
    print(f"Total skills embedded: {len(results)}")
    print(f"Embedding dimension: {dim}")

if __name__ == "__main__":
    main()
