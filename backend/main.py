import os

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.pathway import router as pathway_router
from backend.utils.errors import VoicePathError, validation_exception_handler, voicepath_exception_handler


def create_app() -> FastAPI:
    app = FastAPI(
        title="VoicePath Backend",
        version="0.1.0",
        description="Backend orchestration and pathway APIs for the VoicePath hackathon project.",
    )

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[frontend_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(VoicePathError, voicepath_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.include_router(pathway_router)

    @app.get("/api/v1/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "service": "voicepath-backend"}

    @app.get("/health")
    def root_health() -> dict[str, str]:
        return {"status": "ok", "service": "voicepath-backend"}

    return app


app = create_app()
