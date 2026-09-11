from fastapi import APIRouter

from backend.schemas.pathway import (
    AnalyzeRequest,
    AnalyzeResponse,
    LearningPathRequest,
    LearningPathResponse,
    SkillGapRequest,
    SkillGapResponse,
    WhatIfRequest,
    WhatIfResponse,
)
from backend.services.orchestration import analyze_pathway
from backend.services.pathway import calculate_skill_gap, generate_learning_path, simulate_what_if


router = APIRouter(prefix="/api/v1", tags=["member4-pathway"])


@router.post("/skill-gap", response_model=SkillGapResponse)
def skill_gap(request: SkillGapRequest) -> SkillGapResponse:
    return calculate_skill_gap(request.current_skills, request.required_skills)


@router.post("/learning-path", response_model=LearningPathResponse)
def learning_path(request: LearningPathRequest) -> LearningPathResponse:
    missing_skills = request.missing_skills
    if not missing_skills and request.required_skills:
        missing_skills = calculate_skill_gap(request.current_skills, request.required_skills).missing_skills
    return generate_learning_path(missing_skills)


@router.post("/what-if", response_model=WhatIfResponse)
def what_if(request: WhatIfRequest) -> WhatIfResponse:
    return simulate_what_if(request.current_skills, request.required_skills, request.added_skills)


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    return analyze_pathway(request)
