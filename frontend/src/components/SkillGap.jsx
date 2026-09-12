import { useState } from 'react'

/**
 * SkillGap — Visual diagnostic separating existing skills from missing role requirements.
 *
 * @param {{
 *   gapData: import('../data/mockData').TEXTILE_WORKER_SKILL_GAP,
 *   onStartLearning: (targetRole: string) => void
 * }} props
 */
export default function SkillGap({ gapData, onStartLearning }) {
  const [selectedRole] = useState(
    gapData?.target_role || 'Apparel Quality Assurance (QA) Supervisor'
  )

  if (!gapData) return null

  const currentSkills = gapData.current_skills || []
  const gapSkills     = gapData.gap_skills || []
  const readinessPct  = Math.round((gapData.readiness_score || 0.74) * 100)

  // Priority color map
  const priorityColor = {
    high:   { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)' },
    medium: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)' },
    low:    { color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.35)' },
  }

  const totalHours = gapSkills.reduce((sum, g) => sum + (g.estimated_hours || 0), 0)

  return (
    <div className="vp-skill-gap-view vp-fade-in">
      {/* Top Banner with Readiness Meter */}
      <div className="vp-gap-header-card glass-card">
        <div className="vp-gap-header-info">
          <span className="vp-badge vp-badge--accent" style={{ fontSize: '0.75rem', marginBottom: 4 }}>
            Vocational Role Diagnostic
          </span>
          <h2 className="vp-gap-role-title text-primary">
            Target: {selectedRole}
          </h2>
          <p className="vp-gap-role-sub text-secondary">
            Comparative analysis between your verified spoken experience and tier-1 apparel benchmarks.
          </p>
        </div>

        {/* Readiness Ring / Badge */}
        <div className="vp-gap-readiness-pill">
          <div className="vp-gap-readiness-val-circle">
            <span className="font-mono font-bold" style={{ fontSize: '1.25rem', color: '#34D399' }}>
              {readinessPct}%
            </span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <span className="text-primary font-semibold" style={{ fontSize: '0.9rem', display: 'block' }}>
              Role Readiness
            </span>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>
              ~{totalHours} hrs to 100% eligibility
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Existing Skills vs Missing Requirements */}
      <div className="vp-gap-split-grid">
        {/* Column 1: Existing Skills */}
        <div className="vp-gap-column glass-card">
          <div className="vp-gap-column__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="vp-gap-col-icon success">✓</span>
              <h3 className="vp-gap-col-title text-primary">
                Skills You Have Verified ({currentSkills.length})
              </h3>
            </div>
            <span className="vp-badge vp-badge--success" style={{ fontSize: '0.7rem' }}>
              Demonstrated
            </span>
          </div>

          <p className="vp-gap-col-desc text-muted">
            Extracted directly and inferred from your 4-year retail and textile shop tenure.
          </p>

          <ul className="vp-gap-skill-list" role="list">
            {currentSkills.map((skill) => (
              <li key={skill} className="vp-gap-skill-item verified" role="listitem">
                <div className="vp-gap-skill-name-row">
                  <span className="vp-gap-check-icon">✓</span>
                  <span className="vp-gap-skill-name text-primary">{skill}</span>
                </div>
                <span className="vp-gap-skill-tag font-mono text-success">Verified</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: Missing Requirements (Gap Skills) */}
        <div className="vp-gap-column glass-card">
          <div className="vp-gap-column__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="vp-gap-col-icon warning">⚡</span>
              <h3 className="vp-gap-col-title text-primary">
                Missing Requirements ({gapSkills.length})
              </h3>
            </div>
            <span className="vp-badge vp-badge--warning" style={{ fontSize: '0.7rem' }}>
              Upskill Needed
            </span>
          </div>

          <p className="vp-gap-col-desc text-muted">
            Prioritized competencies required to qualify for promotion to QA Supervisor.
          </p>

          <div className="vp-gap-missing-list">
            {gapSkills.map((g) => {
              const pStyle = priorityColor[g.priority] || priorityColor.medium
              return (
                <div key={g.skill} className="vp-gap-missing-card">
                  <div className="vp-gap-missing-top">
                    <strong className="vp-gap-missing-name text-primary">
                      {g.skill}
                    </strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        className="vp-badge"
                        style={{
                          backgroundColor: pStyle.bg,
                          color: pStyle.color,
                          borderColor: pStyle.border,
                          borderWidth: 1,
                          borderStyle: 'solid',
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        {g.priority} priority
                      </span>
                      <span className="vp-badge vp-badge--neutral font-mono" style={{ fontSize: '0.68rem' }}>
                        ⏱️ ~{g.estimated_hours}h
                      </span>
                    </div>
                  </div>

                  <p className="vp-gap-missing-reason text-secondary">
                    {g.reason}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Action to Launch Pathway */}
      <div className="vp-gap-footer-cta">
        <button
          id="vp-start-learning-btn"
          className="vp-btn vp-btn--primary vp-btn--lg glow-violet"
          onClick={() => onStartLearning?.(selectedRole)}
          type="button"
        >
          <span>Launch Personalized Learning Pathway</span>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
