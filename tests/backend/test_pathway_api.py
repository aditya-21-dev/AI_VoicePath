from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_skill_gap_endpoint_response():
    response = client.post(
        "/api/v1/skill-gap",
        json={
            "current_skills": ["Inventory Management", "Customer Handling"],
            "required_skills": [
                "Inventory Management",
                "Customer Handling",
                "Digital Inventory Systems",
                "Basic Computer Operations",
            ],
        },
    )

    assert response.status_code == 200
    assert response.json()["missing_skills"] == [
        "Digital Inventory Systems",
        "Basic Computer Operations",
    ]


def test_learning_path_endpoint_response():
    response = client.post(
        "/api/v1/learning-path",
        json={"missing_skills": ["Digital Inventory Systems"]},
    )

    assert response.status_code == 200
    assert response.json()["learning_path"][0]["skill"] == "Digital Inventory Systems"


def test_learning_path_endpoint_derives_gaps():
    response = client.post(
        "/api/v1/learning-path",
        json={
            "current_skills": ["Inventory Management"],
            "required_skills": ["Inventory Management", "Basic Computer Operations"],
        },
    )

    assert response.status_code == 200
    assert response.json()["learning_path"][0]["skill"] == "Basic Computer Operations"


def test_what_if_endpoint_response():
    response = client.post(
        "/api/v1/what-if",
        json={
            "current_skills": ["Inventory Management"],
            "required_skills": ["Inventory Management", "Customer Handling"],
            "added_skills": ["Customer Handling"],
        },
    )

    assert response.status_code == 200
    assert response.json()["projected_readiness"] == 100.0


def test_analyze_endpoint_response():
    response = client.post(
        "/api/v1/analyze",
        json={
            "current_skills": ["Inventory Management"],
            "required_skills": ["Inventory Management", "Customer Handling"],
            "added_skills": ["Customer Handling"],
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert body["skill_gap"]["missing_skills"] == ["Customer Handling"]
    assert body["what_if"]["projected_readiness"] == 100.0


def test_invalid_request_body_response():
    response = client.post("/api/v1/skill-gap", json={"required_skills": "not-a-list"})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_missing_required_fields_response():
    response = client.post("/api/v1/what-if", json={"current_skills": []})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_fallback_error_response():
    response = client.post(
        "/api/v1/skill-gap",
        json={"current_skills": ["Inventory Management"], "required_skills": []},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "MISSING_REQUIRED_SKILLS"
