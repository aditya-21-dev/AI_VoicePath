import { useState } from 'react'

/**
 * LearningPath — Timeline view featuring numbered glowing nodes, duration estimates,
 * and actionable step learning resources.
 *
 * @param {{
 *   pathData: import('../data/mockData').TEXTILE_WORKER_LEARNING_PATH,
 *   onBookmarkResource?: (title: string) => void
 * }} props
 */
export default function LearningPath({ pathData, onBookmarkResource }) {
  const [completedPhases, setCompletedPhases] = useState([1]) // Phase 1 completed for interactive demo feel
  const [activePhase, setActivePhase]         = useState(2)

  if (!pathData) return null

  const phases = pathData.phases || []
  const totalWeeks = pathData.total_estimated_weeks || 8

  function togglePhaseComplete(phaseNum) {
    setCompletedPhases((prev) =>
      prev.includes(phaseNum) ? prev.filter((p) => p !== phaseNum) : [...prev, phaseNum]
    )
  }

  const completionPct = Math.round((completedPhases.length / phases.length) * 100)

  return (
    <div className="vp-learning-path-view vp-fade-in">
      {/* Header with Timeline Progress */}
      <div className="vp-path-header-card glass-card">
        <div className="vp-path-header-info">
          <span className="vp-badge vp-badge--accent" style={{ fontSize: '0.72rem', marginBottom: 4 }}>
            Tailored Upskilling Pathway
          </span>
          <h2 className="vp-path-title text-primary">
            {pathData.target_role}
          </h2>
          <p className="vp-path-sub text-secondary">
            A step-by-step vocational roadmap designed around your current sewing &amp; inventory strengths.
          </p>
        </div>

        {/* Total Time & Progress Metric */}
        <div className="vp-path-meta-box">
          <div className="vp-path-duration-chip font-mono">
            ⏱️ Total Duration: ~{totalWeeks} Weeks
          </div>
          <div className="vp-path-progress-track">
            <div className="vp-path-progress-fill" style={{ width: `${completionPct}%` }} />
          </div>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
            {completedPhases.length} of {phases.length} milestones finished ({completionPct}%)
          </span>
        </div>
      </div>

      {/* Vertical Timeline with Numbered Glowing Nodes */}
      <div className="vp-timeline-container" role="feed" aria-label="Learning pathway milestones">
        {phases.map((phase) => {
          const isCompleted = completedPhases.includes(phase.phase)
          const isActive    = activePhase === phase.phase

          return (
            <article
              key={phase.phase}
              className={`vp-timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
            >
              {/* Left timeline spine with Glowing Numbered Node */}
              <div className="vp-timeline-spine">
                <button
                  className={`vp-timeline-node ${isCompleted ? 'done' : isActive ? 'current' : ''}`}
                  onClick={() => togglePhaseComplete(phase.phase)}
                  type="button"
                  aria-label={`Milestone ${phase.phase}: ${phase.title}. Click to mark complete.`}
                  title={isCompleted ? 'Completed (Click to undo)' : 'Click to mark completed'}
                >
                  {isCompleted ? '✓' : phase.phase}
                </button>
                <div className="vp-timeline-connector-line" />
              </div>

              {/* Right content card */}
              <div
                className="vp-timeline-content glass-card"
                onClick={() => setActivePhase(phase.phase)}
              >
                <div className="vp-timeline-card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="vp-badge vp-badge--neutral font-mono" style={{ fontSize: '0.7rem' }}>
                        Phase {phase.phase} · {phase.duration_weeks} Weeks
                      </span>
                      {isCompleted && (
                        <span className="vp-badge vp-badge--success" style={{ fontSize: '0.7rem' }}>
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="vp-timeline-phase-title text-primary">
                      {phase.title}
                    </h3>
                  </div>

                  <button
                    className={`vp-btn vp-btn--sm ${isCompleted ? 'vp-btn--ghost' : 'vp-btn--secondary'}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePhaseComplete(phase.phase)
                    }}
                    type="button"
                  >
                    {isCompleted ? 'Mark Incomplete' : 'Mark Completed ✓'}
                  </button>
                </div>

                {/* Target Competencies */}
                <div className="vp-timeline-skills-row">
                  <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    Target Skills:
                  </span>
                  {phase.skills.map((s) => (
                    <span key={s} className="vp-badge vp-badge--accent" style={{ fontSize: '0.72rem' }}>
                      {s}
                    </span>
                  ))}
                </div>

                {/* Curated Resources with Step Actions */}
                <div className="vp-timeline-resources-list">
                  <span className="text-secondary" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Curated Vocational Materials:
                  </span>

                  {phase.resources.map((res, rIdx) => (
                    <div key={rIdx} className="vp-resource-row">
                      <div className="vp-resource-meta">
                        <span className="vp-resource-icon">
                          {res.type === 'course' ? '🎓' : res.type === 'guide' ? '📖' : '📋'}
                        </span>
                        <div>
                          <strong className="vp-resource-title text-primary">
                            {res.title}
                          </strong>
                          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                            <span className="vp-badge vp-badge--cyan" style={{ fontSize: '0.65rem' }}>
                              {res.type}
                            </span>
                            {res.free && (
                              <span className="vp-badge vp-badge--success" style={{ fontSize: '0.65rem' }}>
                                Free Access
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="vp-resource-actions">
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="vp-btn vp-btn--ghost vp-btn--sm"
                          onClick={() => onBookmarkResource?.(res.title)}
                        >
                          <span>Open Resource</span>
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M6 3h7v7M13 3L6 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
