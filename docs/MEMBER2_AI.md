# Member 2: AI / ASR / Skill Intelligence

The Member 2 boundary is audio ? ASR ? transcript ? evidence-backed profile.
It exposes `POST /api/v1/transcribe` and `POST /api/v1/extract-profile`;
it does not match opportunities or produce learning pathways.

## ASR

Faster-Whisper uses the `small` CPU/int8 model and is loaded lazily, once per
process. `VOICEPATH_ASR_MODEL` can override the model. Its segment log
probabilities are converted to a bounded confidence-like indicator. This is
not a calibrated probability or a guarantee of transcript accuracy.

Whisper supports English, Tamil, and many other languages, and often handles
code-switching. Recording quality, accent, model coverage, and mixed language
speech still limit accuracy. Download the model before an offline demo.

If ASR is unavailable, `VOICEPATH_DEMO_TRANSCRIPT` enables an explicit known
transcript fallback. It is off by default; empty or obviously invalid uploads
always return structured errors, never a fabricated live result.

## Extraction

When `GEMINI_API_KEY` is present, extraction uses the current
`google-genai` SDK and validates returned JSON with Pydantic. Every returned
LLM skill must have raw phrase and evidence found in the transcript. If Gemini
is unavailable or fails, deterministic evidence-first rules return the same
schema without inventing facts.

No agreed `data/skills.csv` existed when this module was added. The small,
conservative normalization rules are in
`backend/services/normalization.py`, ready to align with the shared taxonomy.
Embeddings are intentionally deferred: they would add a heavy dependency
without improving the deterministic demo path.
