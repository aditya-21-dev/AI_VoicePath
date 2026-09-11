# VoicePath API contract

This document records the currently agreed integration surface. It intentionally does not define request or response shapes that the team has not yet agreed.

## Base path

All application endpoints are under `/api/v1`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service health check |
| `POST` | `/transcribe` | Submit audio for transcription |
| `POST` | `/extract-profile` | Extract a profile from a transcript |
| `POST` | `/match-opportunities` | Match a profile against opportunities |
| `POST` | `/learning-path` | Generate a learning path |
| `POST` | `/analyze` | Orchestrate the supported analysis flow |

## Shared skill fields

When a skill is exchanged between services or returned to the client, preserve these field names:

| Field | Meaning |
| --- | --- |
| `canonical_name` | Normalized skill name |
| `raw_phrase` | Source phrase from the beneficiary's speech or transcript |
| `evidence` | Supporting evidence for the skill |
| `confidence` | Confidence associated with the skill or inference |
| `inference_type` | How the skill was inferred |

## Shared opportunity-matching fields

When an opportunity match is exchanged between services or returned to the client, preserve these field names:

| Field | Meaning |
| --- | --- |
| `opportunity_id` | Stable opportunity identifier |
| `title` | Opportunity title |
| `match_score` | Matching score |
| `district` | Relevant district |
| `type` | Opportunity type |
| `matched_skills` | Skills that support the match |
| `missing_skills` | Skills needed to improve eligibility or fit |
| `eligibility_status` | Eligibility outcome or status |
| `reasons` | Explainable reasons for the match |
| `evidence` | Evidence supporting the result |
| `source_url` | Source URL for the opportunity |

## Change policy

The API contract, `backend/schemas/`, and shared field names are team-owned. Discuss and document a compatible migration before renaming a route or any field above.
