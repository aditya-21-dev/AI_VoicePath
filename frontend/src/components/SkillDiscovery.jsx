import SkillCard from './SkillCard.jsx'

/**
 * SkillDiscovery — shows the full grid of detected skills.
 * Receives the full analysis result from the API service.
 *
 * @param {{
 *   analysisResult: import('../data/mockData').MOCK_VOICE_ANALYSIS,
 *   onContinue: () => void,
 *   onStartOver: () => void,
 * }} props
 */
export default function SkillDiscovery({ analysisResult, onContinue, onStartOver }) {
  if (!analysisResult) return null

  const { profile } = analysisResult
  const skills = profile.skills ?? []

  // Compute breakdown stats
  const explicit = skills.filter((s) => s.inference_type === 'explicit').length
  const implicit = skills.filter((s) => s.inference_type === 'implicit').length
  const inferred = skills.filter((s) => s.inference_type === 'inferred').length
  const avgConf  = skills.length
    ? Math.round((skills.reduce((sum, s) => sum + s.confidence, 0) / skills.length) * 100)
    : 0

  return (
    <div className="vp-discovery">
      {/* Page title */}
      <div className="vp-page-title">
        <p className="vp-page-title__eyebrow">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
            <line x1="7" y1="4" x2="7" y2="7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="7" cy="10" r="0.8" fill="currentColor" />
          </svg>
          Step 3 of 4
        </p>
        <h1 className="vp-page-title__h1">
          {skills.length} skill{skills.length !== 1 ? 's' : ''} detected
        </h1>
        <p className="vp-page-title__sub">
          Click any card and open &ldquo;Why was this skill detected?&rdquo; to see the exact phrases we found.
        </p>
      </div>

      {/* Summary pills */}
      <div className="vp-discovery__header">
        <div className="vp-discovery__summary-row" role="region" aria-label="Skill summary">
          <span className="vp-stat-pill">
            <span className="vp-stat-pill__value">{skills.length}</span>
            <span className="vp-stat-pill__label">Skills total</span>
          </span>
          <span className="vp-stat-pill">
            <span className="vp-stat-pill__value" style={{ color: '#4ade80' }}>{explicit}</span>
            <span className="vp-stat-pill__label">Directly mentioned</span>
          </span>
          <span className="vp-stat-pill">
            <span className="vp-stat-pill__value" style={{ color: '#facc15' }}>{implicit}</span>
            <span className="vp-stat-pill__label">Implied</span>
          </span>
          <span className="vp-stat-pill">
            <span className="vp-stat-pill__value" style={{ color: 'var(--accent-hover)' }}>{inferred}</span>
            <span className="vp-stat-pill__label">Inferred</span>
          </span>
          <span className="vp-stat-pill">
            <span className="vp-stat-pill__value">{avgConf}%</span>
            <span className="vp-stat-pill__label">Avg. confidence</span>
          </span>
        </div>

        {/* Legend */}
        <div className="vp-discovery__legend" aria-label="Colour legend">
          <div className="vp-legend-item">
            <span className="vp-legend-dot vp-legend-dot--explicit" />
            Directly mentioned in your speech
          </div>
          <div className="vp-legend-item">
            <span className="vp-legend-dot vp-legend-dot--implicit" />
            Implied by what you described
          </div>
          <div className="vp-legend-item">
            <span className="vp-legend-dot vp-legend-dot--inferred" />
            Inferred from your role or context
          </div>
        </div>
      </div>

      {/* Skills grid — staggered fade-in */}
      {skills.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-12) var(--space-4)',
            color: 'var(--text-muted)',
            fontSize: '1rem',
          }}
        >
          No skills were detected. Try{' '}
          <button
            className="vp-btn vp-btn--ghost vp-btn--sm"
            onClick={onStartOver}
            type="button"
          >
            re-recording
          </button>
          .
        </div>
      ) : (
        <div
          className="vp-discovery__grid"
          role="list"
          aria-label="Detected skills"
        >
          {skills.map((skill, i) => (
            <div key={skill.canonical_name} role="listitem">
              <SkillCard skill={skill} animationDelay={i * 60} />
            </div>
          ))}
        </div>
      )}

      {/* Bottom actions */}
      <div className="vp-discovery__bottom">
        <button
          className="vp-btn vp-btn--ghost"
          onClick={onStartOver}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8a5 5 0 1 1 1.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <polyline points="1,5 3,8 6,6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Start over
        </button>

        <button
          id="vp-view-profile-btn"
          className="vp-btn vp-btn--primary"
          onClick={onContinue}
          type="button"
          aria-label="View your full skill profile"
        >
          View my profile
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
