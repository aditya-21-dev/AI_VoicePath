import pytest

from backend.services.pathway import calculate_skill_gap, generate_learning_path, simulate_what_if
from backend.utils.errors import VoicePathError


REQUIRED_SKILLS = [
    "Inventory Management",
    "Customer Handling",
    "Digital Inventory Systems",
    "Basic Computer Operations",
]


def test_skill_gap_with_matching_skills():
    result = calculate_skill_gap(["Inventory Management", "Customer Handling"], REQUIRED_SKILLS)

    assert result.matched_skills == ["Inventory Management", "Customer Handling"]


def test_skill_gap_with_missing_skills():
    result = calculate_skill_gap(["Inventory Management", "Customer Handling"], REQUIRED_SKILLS)

    assert result.missing_skills == ["Digital Inventory Systems", "Basic Computer Operations"]


def test_skill_gap_with_empty_current_skills():
    result = calculate_skill_gap([], REQUIRED_SKILLS)

    assert result.matched_skills == []
    assert result.missing_skills == REQUIRED_SKILLS


def test_skill_gap_with_duplicate_skills():
    result = calculate_skill_gap(
        ["Inventory Management", "inventory management", "Customer Handling"],
        [*REQUIRED_SKILLS, "customer handling"],
    )

    assert result.current_skills == ["Inventory Management", "Customer Handling"]
    assert result.required_skills == REQUIRED_SKILLS


def test_learning_path_generated_from_missing_skills():
    result = generate_learning_path(["Digital Inventory Systems", "Basic Computer Operations"])

    assert len(result.learning_path) == 3
    assert result.learning_path[0].skill == "Digital Inventory Systems"
    assert result.learning_path[0].source_type == "placeholder"


def test_learning_path_when_no_gaps_exist():
    result = generate_learning_path([])

    assert result.learning_path == []
    assert result.no_gap_message is not None


def test_what_if_with_one_added_skill():
    result = simulate_what_if(["Inventory Management"], REQUIRED_SKILLS, ["Customer Handling"])

    assert result.current_readiness == 25.0
    assert result.projected_readiness == 50.0
    assert result.projection_label == "VoicePath Projection"


def test_what_if_with_multiple_added_skills():
    result = simulate_what_if(
        ["Inventory Management"],
        REQUIRED_SKILLS,
        ["Customer Handling", "Digital Inventory Systems"],
    )

    assert result.current_readiness == 25.0
    assert result.projected_readiness == 75.0


def test_missing_required_skills_error():
    with pytest.raises(VoicePathError) as exc:
        calculate_skill_gap(["Inventory Management"], [])

    assert exc.value.code == "MISSING_REQUIRED_SKILLS"


def test_invalid_what_if_input_error():
    with pytest.raises(VoicePathError) as exc:
        simulate_what_if(["Inventory Management"], REQUIRED_SKILLS, [])

    assert exc.value.code == "MISSING_ADDED_SKILLS"
