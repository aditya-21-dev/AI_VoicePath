/**
 * VoicePath API Service Layer
 *
 * All functions simulate network latency so components can wire up loading/
 * error states exactly as they will against the real FastAPI backend.
 *
 * When the backend is ready, swap the mock return values for real fetch() calls.
 * The function signatures and return shapes must remain identical.
 */

import {
  MOCK_VOICE_ANALYSIS,
  MOCK_PROFILE,
  MOCK_OPPORTUNITIES,
  MOCK_SKILL_GAP,
  MOCK_LEARNING_PATH,
  MOCK_WHAT_IF,
} from '../data/mockData.js';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Simulates a network round-trip.
 * @param {number} [ms=900] - Artificial delay in milliseconds.
 * @returns {Promise<void>}
 */
const delay = (ms = 900) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps a mock value in a standardised API response envelope.
 * @template T
 * @param {T} data
 * @param {string} [message='OK']
 * @returns {{ success: boolean, data: T, message: string }}
 */
const ok = (data, message = 'OK') => ({ success: true, data, message });

// ─── analyzeVoice ──────────────────────────────────────────────────────────────

/**
 * Submit a voice recording (Blob or File) or a text transcript for analysis.
 *
 * Real API: POST /api/v1/analyze
 *
 * @param {{ audio?: Blob|File, transcript?: string }} payload
 * @returns {Promise<{ success: boolean, data: import('../data/mockData.js').MOCK_VOICE_ANALYSIS, message: string }>}
 */
export async function analyzeVoice(payload) {
  // Validate that at least one input is provided.
  if (!payload?.audio && !payload?.transcript) {
    throw new Error('analyzeVoice: either audio or transcript must be provided.');
  }

  // Longer delay to mimic transcription + NLP pipeline.
  await delay(1800);

  return ok(MOCK_VOICE_ANALYSIS, 'Voice analysed successfully.');
}

// ─── getProfile ────────────────────────────────────────────────────────────────

/**
 * Retrieve the current user's skill profile.
 *
 * Real API: GET /api/v1/profile/:userId
 *
 * @param {string} [userId='usr_demo_001']
 * @returns {Promise<{ success: boolean, data: typeof MOCK_PROFILE, message: string }>}
 */
export async function getProfile(userId = 'usr_demo_001') {
  await delay(600);

  if (!userId) throw new Error('getProfile: userId is required.');

  return ok(MOCK_PROFILE, 'Profile loaded.');
}

// ─── getOpportunities ─────────────────────────────────────────────────────────

/**
 * Fetch job opportunities matched against the user's current skill profile.
 *
 * Real API: GET /api/v1/opportunities?userId=&domain=&limit=
 *
 * @param {{ userId?: string, domain?: string, limit?: number }} [params={}]
 * @returns {Promise<{ success: boolean, data: typeof MOCK_OPPORTUNITIES, message: string }>}
 */
export async function getOpportunities(params = {}) {
  await delay(800);

  const { limit = 10 } = params;
  const results = MOCK_OPPORTUNITIES.slice(0, limit);

  return ok(results, `${results.length} opportunities found.`);
}

// ─── getSkillGap ───────────────────────────────────────────────────────────────

/**
 * Compute the skill gap between the user's current profile and a target role.
 *
 * Real API: POST /api/v1/skill-gap
 *
 * @param {{ userId?: string, target_role: string }} params
 * @returns {Promise<{ success: boolean, data: typeof MOCK_SKILL_GAP, message: string }>}
 */
export async function getSkillGap(params = {}) {
  await delay(1000);

  if (!params.target_role) {
    throw new Error('getSkillGap: target_role is required.');
  }

  // In mock mode we return the same dataset regardless of target_role.
  return ok(
    { ...MOCK_SKILL_GAP, target_role: params.target_role },
    'Skill gap computed.'
  );
}

// ─── getLearningPath ───────────────────────────────────────────────────────────

/**
 * Generate a personalised, phase-by-phase learning path to close the skill gap.
 *
 * Real API: POST /api/v1/learning-path
 *
 * @param {{ userId?: string, target_role: string, available_hours_per_week?: number }} params
 * @returns {Promise<{ success: boolean, data: typeof MOCK_LEARNING_PATH, message: string }>}
 */
export async function getLearningPath(params = {}) {
  await delay(1200);

  if (!params.target_role) {
    throw new Error('getLearningPath: target_role is required.');
  }

  return ok(
    { ...MOCK_LEARNING_PATH, target_role: params.target_role },
    'Learning path generated.'
  );
}

// ─── getWhatIf ─────────────────────────────────────────────────────────────────

/**
 * Run what-if scenarios: "if I learned skill X, how would my market position change?"
 *
 * Real API: POST /api/v1/what-if
 *
 * @param {{ userId?: string, hypothetical_skills?: string[] }} [params={}]
 * @returns {Promise<{ success: boolean, data: typeof MOCK_WHAT_IF, message: string }>}
 */
export async function getWhatIf(params = {}) {
  await delay(900);

  const data = { ...MOCK_WHAT_IF };

  // If caller passes specific hypothetical skills, filter to matching scenarios.
  if (params.hypothetical_skills?.length) {
    data.scenarios = MOCK_WHAT_IF.scenarios.filter((s) =>
      s.added_skills.some((skill) => params.hypothetical_skills.includes(skill))
    );
    if (!data.scenarios.length) data.scenarios = MOCK_WHAT_IF.scenarios;
  }

  return ok(data, 'What-if analysis complete.');
}
