/**
 * MatchBreakdown — Explains "Why does this role match you?"
 * Breaks down VoicePath Match Score into 3 key pillars:
 *   1. Skill Similarity (semantic alignment of speech evidence)
 *   2. Experience Match (verified tenure & machine familiarity)
 *   3. District Eligibility (geographical proximity / industrial cluster)
 *
 * @param {{
 *   opportunity: object,
 *   onClose: () => void,
 *   onViewGap: (roleTitle: string) => void
 * }} props
 */
export default function MatchBreakdown({ opportunity, onClose, onViewGap }) {
  if (!opportunity) return null

  const breakdown = opportunity.breakdown || {
    skill_similarity: 0.92,
    experience_match: 0.90,
    district_eligibility: 0.95,
  }

  const skillSimPct = Math.round(breakdown.skill_similarity * 100)
  const expMatchPct = Math.round(breakdown.experience_match * 100)
  const distEligPct = Math.round(breakdown.district_eligibility * 100)
  const eligibilityPct = Math.round((breakdown.eligibility_score ?? 1.0) * 100)
  const overallPct  = Math.round(opportunity.match_score * 100)

  return (
    <div className="vp-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="breakdown-title">
      <div className="vp-modal-card glass-card vp-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="vp-modal-header">
          <div>
            <span className="vp-badge vp-badge--accent" style={{ fontSize: '0.72rem', marginBottom: 4 }}>
              Explainable AI Matching
            </span>
            <h2 id="breakdown-title" className="vp-modal-title">
              Why does this match you?
            </h2>
            <p className="vp-modal-subtitle text-secondary">
              {opportunity.title} at <strong>{opportunity.company}</strong>
            </p>
          </div>

          <button className="vp-modal-close-btn" onClick={onClose} type="button" aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Overall Score Banner */}
        <div className="vp-breakdown-score-banner">
          <div className="vp-score-badge-circle">
            <span className="vp-score-badge-val font-mono">{overallPct}%</span>
          </div>
          <div>
            <p className="vp-score-banner-label">VoicePath Match Score</p>
            <p className="vp-score-banner-desc text-secondary">
              Strong alignment based on spoken workplace tasks and verified 4-year tenure.
            </p>
          </div>
        </div>

        {/* 3 Pillar Progress Bars */}
        <div className="vp-breakdown-metrics-list">
          {/* Pillar 1: Skill Similarity */}
          <div className="vp-metric-item">
            <div className="vp-metric-label-row">
              <span className="vp-metric-name">
                <span className="vp-metric-icon">🧵</span> Skill &amp; Tool Similarity
              </span>
              <span className="vp-metric-pct font-mono text-accent">{skillSimPct}%</span>
            </div>
            <div className="vp-metric-track">
              <div className="vp-metric-fill violet" style={{ width: `${skillSimPct}%` }} />
            </div>
            <p className="vp-metric-subtext text-muted">
              Direct match on industrial sewing machines, stock control, and customer service.
            </p>
          </div>

          {/* Pillar 2: Experience Match */}
          <div className="vp-metric-item">
            <div className="vp-metric-label-row">
              <span className="vp-metric-name">
                <span className="vp-metric-icon">⏳</span> Experience &amp; Seniority
              </span>
              <span className="vp-metric-pct font-mono" style={{ color: '#06B6D4' }}>{expMatchPct}%</span>
            </div>
            <div className="vp-metric-track">
              <div className="vp-metric-fill cyan" style={{ width: `${expMatchPct}%` }} />
            </div>
            <p className="vp-metric-subtext text-muted">
              4 years in retail textile shop exceeds employer requirement of 2-3 years.
            </p>
          </div>

          {/* Pillar 3: District Eligibility */}
          <div className="vp-metric-item">
            <div className="vp-metric-label-row">
              <span className="vp-metric-name">
                <span className="vp-metric-icon">📍</span> District &amp; Cluster Eligibility
              </span>
              <span className="vp-metric-pct font-mono" style={{ color: '#F59E0B' }}>{distEligPct}%</span>
            </div>
            <div className="vp-metric-track">
              <div className="vp-metric-fill amber" style={{ width: `${distEligPct}%` }} />
            </div>
            <p className="vp-metric-subtext text-muted">
              Located in target corridor ({opportunity.district || 'Chennai / Tiruvallur'}).
            </p>
          </div>

          {/* Pillar 4: Role Eligibility */}
          <div className="vp-metric-item">
            <div className="vp-metric-label-row">
              <span className="vp-metric-name">
                <span className="vp-metric-icon">✓</span> Candidate Eligibility
              </span>
              <span className="vp-metric-pct font-mono text-success">{eligibilityPct}%</span>
            </div>
            <div className="vp-metric-track">
              <div className="vp-metric-fill emerald" style={{ width: `${eligibilityPct}%` }} />
            </div>
            <p className="vp-metric-subtext text-muted">
              Satisfies statutory and employer prerequisites ({opportunity.eligibility || '100% Eligible'}).
            </p>
          </div>
        </div>

        {/* Employer Context Note */}
        {opportunity.why_matched && (
          <div className="vp-breakdown-quote-box">
            <p className="vp-breakdown-quote-title text-primary">
              💡 Employer Benchmark Note:
            </p>
            <p className="vp-breakdown-quote-text">
              &ldquo;{opportunity.why_matched}&rdquo;
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="vp-modal-footer">
          <button className="vp-btn vp-btn--ghost" onClick={onClose} type="button">
            Close
          </button>
          <button
            className="vp-btn vp-btn--primary glow-violet"
            onClick={() => {
              onClose()
              onViewGap?.(opportunity.title)
            }}
            type="button"
          >
            <span>Analyze Skill Gap for This Role</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
