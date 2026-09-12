import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


DEFAULT_DATABASE_URL = "postgresql://postgres@localhost:5432/voicepath"
PROJECT_ROOT = Path(__file__).resolve().parents[2]


if load_dotenv:
    load_dotenv(PROJECT_ROOT / ".env")


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
