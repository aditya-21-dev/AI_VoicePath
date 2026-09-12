import csv
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data" / "demo"


def load_csv(name):
    with open(DATA_DIR / name, "r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def split_skills(value):
    return [skill.strip() for skill in value.split(";") if skill.strip()]


def test_opportunity_data_required_fields_and_unique_ids():
    required_columns = {
        "Opportunity_ID",
        "Scheme",
        "Course_Name",
        "Skill_Category",
        "Required_Skills",
        "District",
        "State",
        "Eligibility",
        "Duration",
        "Provider",
        "Type",
        "Source_URL",
    }
    opportunities = load_csv("opportunities.csv")

    assert len(opportunities) == 10
    assert required_columns.issubset(opportunities[0].keys())

    opportunity_ids = [row["Opportunity_ID"] for row in opportunities]
    assert len(opportunity_ids) == len(set(opportunity_ids))

    for row in opportunities:
        for column in required_columns:
            assert row[column].strip(), f"{row['Opportunity_ID']} has blank {column}"


def test_skill_taxonomy_has_unique_ids_and_names():
    skills = load_csv("skills.csv")
    skill_ids = [row["skill_id"] for row in skills]
    canonical_names = [row["canonical_name"] for row in skills]

    assert len(skills) == 27
    assert len(skill_ids) == len(set(skill_ids))
    assert len(canonical_names) == len(set(canonical_names))


def test_opportunity_required_skills_resolve_to_canonical_skills():
    skills = load_csv("skills.csv")
    canonical_names = {row["canonical_name"] for row in skills}
    opportunities = load_csv("opportunities.csv")

    required_skills = {
        skill
        for row in opportunities
        for skill in split_skills(row["Required_Skills"])
    }

    assert required_skills <= canonical_names


def test_opportunity_skill_mapping_resolves_to_opportunities_and_canonical_skills():
    skills = load_csv("skills.csv")
    canonical_names = {row["canonical_name"] for row in skills}
    opportunities = load_csv("opportunities.csv")
    opportunity_ids = {row["Opportunity_ID"] for row in opportunities}
    mappings = load_csv("opportunity_skill_mapping.csv")

    assert len(mappings) == 10
    assert {row["Opportunity_ID"] for row in mappings} == opportunity_ids

    mapping_skills = {
        skill
        for row in mappings
        for skill in split_skills(row["Required_Skills"])
    }

    assert mapping_skills <= canonical_names


def test_mapping_skills_match_opportunity_required_skills():
    opportunities = {
        row["Opportunity_ID"]: split_skills(row["Required_Skills"])
        for row in load_csv("opportunities.csv")
    }
    mappings = load_csv("opportunity_skill_mapping.csv")

    for row in mappings:
        assert split_skills(row["Required_Skills"]) == opportunities[row["Opportunity_ID"]]


if __name__ == "__main__":
    test_opportunity_data_required_fields_and_unique_ids()
    test_skill_taxonomy_has_unique_ids_and_names()
    test_opportunity_required_skills_resolve_to_canonical_skills()
    test_opportunity_skill_mapping_resolves_to_opportunities_and_canonical_skills()
    test_mapping_skills_match_opportunity_required_skills()
    print("Validation passed: opportunity data, skill taxonomy, and curated mappings are internally consistent.")
