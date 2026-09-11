# VoicePath

> Speak your experience. Discover your skills. Find your path.

**Track:** Edutech
**Problem Statement:** PS 04 — VoicePath

VoicePath converts a beneficiary's natural spoken work experience into evidence-backed skills, matches them with relevant district-level opportunities, identifies skill gaps, and provides a personalized learning path.

## Architecture

```text
Voice
  ↓
ASR
  ↓
Transcript
  ↓
Skill Extraction
  ↓
Skill Normalization
  ↓
Evidence + Confidence
  ↓
Opportunity Matching
  ↓
Explainable Ranking
  ↓
Skill Gap
  ↓
Learning Path
  ↓
What-If
  ↓
Frontend
```

The frontend communicates only with VoicePath backend APIs. Bhashini and hosted-LLM credentials remain in backend environment variables and must never be exposed to the browser.

## Technology stack

- Frontend: React and Vite
- Backend: Python and FastAPI (integration scaffold)
- Database: PostgreSQL with pgvector (planned)
- ASR: Bhashini, with Whisper/local fallback (planned)
- LLM: Gemini or an equivalent hosted LLM (planned)
- Matching: local, explainable ranking (planned)

## Repository structure

```text
VoicePath/
├── frontend/              # React + Vite application
├── backend/
│   ├── routes/            # API routing (integration scaffold)
│   ├── services/          # ASR, extraction, matching, and pathway services
│   ├── database/          # Database integration
│   ├── schemas/           # Shared backend schemas
│   └── utils/             # Backend utilities
├── data/
│   └── demo/              # Versioned demo data only
├── docs/
│   └── API_CONTRACT.md    # Agreed API surface and shared fields
└── tests/
    ├── frontend/
    └── backend/
```

The backend, data, and test folders are intentionally empty scaffolds until their owners add implementation. See [the API contract](docs/API_CONTRACT.md) before changing shared fields or routes.

## Local setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite development server is normally available at `http://localhost:5173`. Create a production build with `npm run build`; preview it locally with `npm run preview`.

### Backend

The FastAPI implementation has not been added yet. Once it exists, create a virtual environment, install its declared dependencies, set the root environment variables, and run the application on `http://localhost:8000`.

## Environment variables

Copy `.env.example` to `.env` and set values locally. API keys belong only in backend environment variables; never use Vite client environment variables for Bhashini, Gemini, database, or other server credentials.

```bash
Copy-Item .env.example .env
```

On macOS/Linux, use `cp .env.example .env` instead. The `.env` file is ignored by Git.

## Team branches

```text
main
├── feature/member1-frontend
├── feature/member2-ai
├── feature/member3-data-matching
└── feature/member4-integration-pathway
```

Create feature branches from an up-to-date `main`; this initial repository intentionally contains only `main`.

## Collaboration rules

- Member 1 owns `frontend/`.
- Member 2 owns `backend/services/asr.py`, `extraction.py`, and `normalization.py`.
- Member 3 owns `data/`, `backend/database/`, `backend/services/matching.py`, and `ranking.py`.
- Member 4 owns `backend/main.py`, `backend/routes/`, `backend/services/pathway.py`, `orchestration.py`, and deployment integration.
- Coordinate changes to API contracts, `backend/schemas/`, `.env.example`, `README.md`, and `.gitignore`.
- Keep integration incremental: mocks are acceptable while upstream components are unavailable, but do not change agreed contracts without team discussion.

## Security

**Never commit `.env` files, API keys, tokens, passwords, or other secrets.** If a credential is exposed, revoke it with its provider and remove it from source and Git history before sharing the repository.
