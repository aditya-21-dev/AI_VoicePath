/**
 * VoicePath API Service Layer
 * Team: Code Red | Track: Edutech | Year: 2026
 *
 * Clean, structured asynchronous mock endpoints for:
 *   - Voice analysis (transcription + skill discovery)
 *   - Skill profiles & updates
 *   - Matched opportunities
 *   - Skill gap diagnostics
 *   - Personalized phased learning paths
 *   - "What-If" career & salary projections
 *
 * Designed with simulated network latency to validate UI loading & error states.
 * Fully prepared for backend integration (FastAPI) via VITE_API_BASE_URL.
 */

import {
  TEXTILE_WORKER_VOICE_ANALYSIS,
  TEXTILE_WORKER_PROFILE,
  TEXTILE_WORKER_OPPORTUNITIES,
  TEXTILE_WORKER_SKILL_GAP,
  TEXTILE_WORKER_LEARNING_PATH,
  TEXTILE_WORKER_WHAT_IF,
  TECH_VOICE_ANALYSIS,
  TECH_PROFILE,
  TECH_OPPORTUNITIES,
  TECH_SKILL_GAP,
  TECH_LEARNING_PATH,
  TECH_WHAT_IF,
  DEMO_PERSONAS,
} from '../data/mockData.js';

// ─── Environment Configuration ─────────────────────────────────────────────────

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '';
const USE_MOCK = !API_BASE_URL || import.meta.env?.VITE_USE_MOCK !== 'false';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Simulates network latency for mock calls.
 * @param {number} [ms=800] - Duration in milliseconds.
 * @returns {Promise<void>}
 */
const delay = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Standardized API response envelope.
 * @template T
 * @param {T} data - Payload
 * @param {string} [message='OK'] - Status message
 * @param {number} [status=200] - HTTP status equivalent
 * @returns {{ success: boolean, data: T, message: string, status: number, timestamp: string }}
 */
const ok = (data, message = 'OK', status = 200) => ({
  success: true,
  data,
  message,
  status,
  timestamp: new Date().toISOString(),
});

/**
 * Standardized error generator.
 * @param {string} message
 * @param {number} [status=400]
 */
const createError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ─── 1. Voice Analysis Endpoint ───────────────────────────────────────────────

/**
 * Submits an audio recording (Blob/File) or transcript text for AI skill extraction.
 * Real Endpoint: POST /api/v1/voice/analyze
 *
 * @param {{
 *   audio?: Blob|File,
 *   transcript?: string,
 *   language?: string,
 *   persona?: 'textile'|'tech'
 * }} payload
 * @returns {Promise<{
 *   success: boolean,
 *   data: typeof TEXTILE_WORKER_VOICE_ANALYSIS,
 *   message: string,
 *   timestamp: string
 * }>}
 */
export async function analyzeVoice(payload = {}) {
  const { audio, transcript, language = 'en-IN', persona } = payload;

  if (!audio && !transcript) {
    throw createError('analyzeVoice: Either an audio file/blob or text transcript must be provided.');
  }

  if (USE_MOCK) {
    // Artificial latency for ASR + NLP pipeline simulation
    await delay(1200);

    const textLower = (transcript || '').toLowerCase();

    // Determine target persona dataset based on content keywords or explicit flag
    const isTech =
      persona === 'tech' ||
      (persona !== 'textile' &&
        (textLower.includes('python') ||
          textLower.includes('machine learning') ||
          textLower.includes('postgres') ||
          textLower.includes('pipeline') ||
          textLower.includes('docker')));

    const baseAnalysis = isTech ? TECH_VOICE_ANALYSIS : TEXTILE_WORKER_VOICE_ANALYSIS;

    // Echo back user's actual transcript in response envelope
    const analysisResult = {
      ...baseAnalysis,
      transcript: transcript || baseAnalysis.transcript,
      detected_language: language,
      analyzed_at: new Date().toISOString(),
    };

    return ok(analysisResult, 'Voice analyzed and skills extracted successfully.');
  }

  // Real backend implementation
  const formData = new FormData();
  if (audio) formData.append('audio', audio);
  if (transcript) formData.append('transcript', transcript);
  formData.append('language', language);

  const res = await fetch(`${API_BASE_URL}/api/v1/voice/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw createError(errData.detail || 'Failed to analyze voice input.', res.status);
  }

  return res.json();
}

// ─── 2. Skill Profile Endpoints ───────────────────────────────────────────────

/**
 * Retrieves a user's canonical skill profile.
 * Real Endpoint: GET /api/v1/profile/:userId
 *
 * @param {string} [userId='usr_textile_001']
 * @param {{ persona?: 'textile'|'tech' }} [options={}]
 * @returns {Promise<{
 *   success: boolean,
 *   data: typeof TEXTILE_WORKER_PROFILE,
 *   message: string,
 *   timestamp: string
 * }>}
 */
export async function getProfile(userId = 'usr_textile_001', options = {}) {
  if (USE_MOCK) {
    await delay(500);

    if (userId === 'usr_tech_001' || options.persona === 'tech') {
      return ok(TECH_PROFILE, 'Profile loaded.');
    }

    // Default canonical persona: Textile Worker (Priya Sharma)
    return ok(TEXTILE_WORKER_PROFILE, 'Profile loaded.');
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/profile/${encodeURIComponent(userId)}`);
  if (!res.ok) {
    throw createError(`Failed to fetch profile for user ${userId}`, res.status);
  }
  return res.json();
}

/**
 * Updates user profile details (name, summary, location).
 * Real Endpoint: PATCH /api/v1/profile/:userId
 *
 * @param {string} userId
 * @param {Partial<typeof TEXTILE_WORKER_PROFILE>} updates
 * @returns {Promise<{ success: boolean, data: object, message: string }>}
 */
export async function updateProfile(userId, updates = {}) {
  if (!userId) throw createError('updateProfile: userId is required.');

  if (USE_MOCK) {
    await delay(600);
    const updated = { ...TEXTILE_WORKER_PROFILE, ...updates, updated_at: new Date().toISOString() };
    return ok(updated, 'Profile updated successfully.');
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/profile/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw createError('Failed to update profile', res.status);
  return res.json();
}

/**
 * Updates or confirms detected skills on a profile.
 * Real Endpoint: PUT /api/v1/profile/:userId/skills
 *
 * @param {string} userId
 * @param {Array<object>} skills
 * @returns {Promise<{ success: boolean, data: Array<object>, message: string }>}
 */
export async function updateSkills(userId, skills = []) {
  if (!userId) throw createError('updateSkills: userId is required.');

  if (USE_MOCK) {
    await delay(500);
    return ok(skills, `${skills.length} skills saved to profile.`);
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/profile/${encodeURIComponent(userId)}/skills`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skills }),
  });
  if (!res.ok) throw createError('Failed to update skills', res.status);
  return res.json();
}

// ─── 3. Opportunities Endpoint ────────────────────────────────────────────────

/**
 * Retrieves career opportunities matching the user's skills.
 * Real Endpoint: GET /api/v1/opportunities
 *
 * @param {{
 *   userId?: string,
 *   domain?: string,
 *   limit?: number,
 *   search?: string,
 *   minMatchScore?: number,
 *   persona?: 'textile'|'tech'
 * }} [params={}]
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<typeof TEXTILE_WORKER_OPPORTUNITIES[0]>,
 *   message: string,
 *   timestamp: string
 * }>}
 */
export async function getOpportunities(params = {}) {
  const {
    userId,
    limit = 10,
    search = '',
    minMatchScore = 0,
    persona,
  } = params;

  if (USE_MOCK) {
    await delay(650);

    const isTech = persona === 'tech' || userId === 'usr_tech_001';
    let results = isTech ? [...TECH_OPPORTUNITIES] : [...TEXTILE_WORKER_OPPORTUNITIES];

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.company.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q)
      );
    }

    if (minMatchScore > 0) {
      results = results.filter((o) => o.match_score >= minMatchScore);
    }

    results = results.slice(0, limit);
    return ok(results, `${results.length} career opportunities matched.`);
  }

  const query = new URLSearchParams();
  if (userId) query.set('userId', userId);
  if (limit) query.set('limit', String(limit));
  if (search) query.set('search', search);

  const res = await fetch(`${API_BASE_URL}/api/v1/opportunities?${query.toString()}`);
  if (!res.ok) throw createError('Failed to fetch opportunities', res.status);
  return res.json();
}

// ─── 4. Skill Gap Analysis Endpoint ───────────────────────────────────────────

/**
 * Computes the skill gap between a user's skills and a target role.
 * Real Endpoint: POST /api/v1/skill-gap
 *
 * @param {{
 *   userId?: string,
 *   target_role?: string,
 *   persona?: 'textile'|'tech'
 * }} params
 * @returns {Promise<{
 *   success: boolean,
 *   data: typeof TEXTILE_WORKER_SKILL_GAP,
 *   message: string,
 *   timestamp: string
 * }>}
 */
export async function getSkillGap(params = {}) {
  const { userId, target_role, persona } = params;

  if (USE_MOCK) {
    await delay(800);

    const isTech = persona === 'tech' || userId === 'usr_tech_001';
    const baseGap = isTech ? TECH_SKILL_GAP : TEXTILE_WORKER_SKILL_GAP;

    const result = {
      ...baseGap,
      target_role: target_role || baseGap.target_role,
    };

    return ok(result, `Skill gap computed for role: ${result.target_role}`);
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/skill-gap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, target_role }),
  });
  if (!res.ok) throw createError('Failed to compute skill gap', res.status);
  return res.json();
}

// ─── 5. Learning Path Endpoint ────────────────────────────────────────────────

/**
 * Generates an actionable, phased upskilling curriculum with curated resources.
 * Real Endpoint: POST /api/v1/learning-path
 *
 * @param {{
 *   userId?: string,
 *   target_role?: string,
 *   available_hours_per_week?: number,
 *   persona?: 'textile'|'tech'
 * }} params
 * @returns {Promise<{
 *   success: boolean,
 *   data: typeof TEXTILE_WORKER_LEARNING_PATH,
 *   message: string,
 *   timestamp: string
 * }>}
 */
export async function getLearningPath(params = {}) {
  const { userId, target_role, available_hours_per_week = 10, persona } = params;

  if (USE_MOCK) {
    await delay(900);

    const isTech = persona === 'tech' || userId === 'usr_tech_001';
    const basePath = isTech ? TECH_LEARNING_PATH : TEXTILE_WORKER_LEARNING_PATH;

    const result = {
      ...basePath,
      target_role: target_role || basePath.target_role,
      available_hours_per_week,
      generated_at: new Date().toISOString(),
    };

    return ok(result, 'Personalized learning path generated.');
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/learning-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, target_role, available_hours_per_week }),
  });
  if (!res.ok) throw createError('Failed to generate learning path', res.status);
  return res.json();
}

// ─── 6. "What-If" Career Projection Endpoint ──────────────────────────────────

/**
 * Runs what-if simulations to calculate market boost and role unlocks from acquiring skills.
 * Real Endpoint: POST /api/v1/what-if
 *
 * @param {{
 *   userId?: string,
 *   hypothetical_skills?: string[],
 *   target_role?: string,
 *   persona?: 'textile'|'tech'
 * }} [params={}]
 * @returns {Promise<{
 *   success: boolean,
 *   data: typeof TEXTILE_WORKER_WHAT_IF,
 *   message: string,
 *   timestamp: string
 * }>}
 */
export async function getWhatIf(params = {}) {
  const { userId, hypothetical_skills = [], persona } = params;

  if (USE_MOCK) {
    await delay(700);

    const isTech = persona === 'tech' || userId === 'usr_tech_001';
    const baseWhatIf = isTech ? TECH_WHAT_IF : TEXTILE_WORKER_WHAT_IF;

    let scenarios = [...baseWhatIf.scenarios];

    // If caller specifies hypothetical skills, prioritize or filter matching scenarios
    if (hypothetical_skills.length > 0) {
      const matched = scenarios.filter((s) =>
        s.added_skills.some((skill) =>
          hypothetical_skills.some((h) => h.toLowerCase() === skill.toLowerCase())
        )
      );
      if (matched.length > 0) scenarios = matched;
    }

    const data = {
      base_profile: baseWhatIf.base_profile,
      scenarios,
    };

    return ok(data, 'What-If projection analysis completed.');
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/what-if`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, hypothetical_skills }),
  });
  if (!res.ok) throw createError('Failed to run What-If projection', res.status);
  return res.json();
}

// ─── 7. Persona Discovery Endpoints ───────────────────────────────────────────

/**
 * Returns available demo personas for testing and UI demonstrations.
 * @returns {Promise<{ success: boolean, data: typeof DEMO_PERSONAS, message: string }>}
 */
export async function getPersonas() {
  await delay(200);
  return ok(DEMO_PERSONAS, 'Demo personas loaded.');
}

/**
 * Fetches a single demo persona by ID ('textile' | 'tech').
 * @param {'textile'|'tech'} personaId
 * @returns {Promise<{ success: boolean, data: object, message: string }>}
 */
export async function getPersona(personaId = 'textile') {
  await delay(200);
  const persona = DEMO_PERSONAS[personaId] || DEMO_PERSONAS.textile;
  return ok(persona, `Persona '${persona.name}' loaded.`);
}

export default {
  analyzeVoice,
  getProfile,
  updateProfile,
  updateSkills,
  getOpportunities,
  getSkillGap,
  getLearningPath,
  getWhatIf,
  getPersonas,
  getPersona,
};
