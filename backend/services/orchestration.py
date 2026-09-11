from backend.schemas.pathway import AnalyzeRequest, AnalyzeResponse
from backend.services.pathway import calculate_skill_gap, generate_learning_path, simulate_what_if


def analyze_pathway(request: AnalyzeRequest) -> AnalyzeResponse:
    required_skills = request.required_skills
    if request.opportunity and request.opportunity.required_skills:
        required_skills = request.opportunity.required_skills
    elif request.opportunity and request.opportunity.missing_skills:
        required_skills = [*request.opportunity.matched_skills, *request.opportunity.missing_skills]

    skill_gap = calculate_skill_gap(request.current_skills, required_skills)
    learning_path = generate_learning_path(skill_gap.missing_skills)
    what_if = None

    if request.added_skills:
        what_if = simulate_what_if(request.current_skills, required_skills, request.added_skills)

    return AnalyzeResponse(
        skill_gap=skill_gap,
        learning_path=learning_path,
        what_if=what_if,
        opportunity=request.opportunity,
    )
