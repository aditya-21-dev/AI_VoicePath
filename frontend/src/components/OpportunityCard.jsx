import { useState } from 'react'

/**
 * OpportunityCard — Displays a verified career opportunity matched to the user.
 * Includes:
 *   - "VoicePath Match Score" badge with circular progress or ring
 *   - District data (e.g. Chennai / Tiruvallur)
 *   - Eligibility badges
 *   - "Why does this match?" button to launch MatchBreakdown
 *   - Required disclaimer
 *
 * @param {{
 *   opportunity: object,
 *   onExplain: (opp: object) => void,
 *   onViewGap: (roleTitle: string) => void,
 *   onBookmark?: (oppTitle: string) => void
 * }} props
 */
export default function OpportunityCard({
  opportunity,
  onExplain,
  onViewGap,
  onBookmark,
}) {
  const [saved, setSaved] = useState(false)

  const matchPct = Math.round(opportunity.match_score * 100)
  const badges   = opportunity.badges || ['Verified Employer', 'District Eligible']

  function handleSave(e) {
    e.stopPropagation()
    setSaved((s) => !s)
    onBookmark?.(opportunity.title)
  }

  return (
    <article className="vp-opp-card glass-card vp-fade-in" aria-label={`${opportunity.title} at ${opportunity.company}`}>
      <div className="vp-opp-card__top">
        <div className="vp-opp-card__meta-left">
          {/* District data pill & Eligibility Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <div className="vp-opp-district-tag">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 1a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5z" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="8" cy="6" r="1.8" fill="currentColor" />
              </svg>
              <span>{opportunity.district || 'Chennai / Tiruvallur'}</span>
            </div>

            {/* Prominent Eligibility Pill */}
            <span className="vp-badge vp-badge--success font-mono" style={{ fontSize: '0.72rem' }}>
              ✓ {opportunity.eligibility || 'Eligible'}
            </span>
          </div>

          <h3 className="vp-opp-title text-primary">{opportunity.title}</h3>
          <p className="vp-opp-company">
            <strong>{opportunity.company}</strong> · <span className="text-muted">{opportunity.location}</span>
          </p>
        </div>

        {/* VoicePath Match Score Badge */}
        <div className="vp-opp-match-box">
          <div className="vp-opp-match-score-pill">
            <span className="vp-opp-match-pct font-mono">{matchPct}%</span>
            <span className="vp-opp-match-label">VoicePath Match</span>
          </div>
          <button
            className={`vp-opp-save-btn ${saved ? 'saved' : ''}`}
            onClick={handleSave}
            type="button"
            aria-label={saved ? 'Remove bookmark' : 'Bookmark this opportunity'}
            title={saved ? 'Bookmarked' : 'Save opportunity'}
          >
            {saved ? '★' : '☆'}
          </button>
        </div>
      </div>

      {/* Badges row */}
      <div className="vp-opp-badges-row">
        {badges.map((b) => (
          <span key={b} className="vp-badge vp-badge--neutral" style={{ fontSize: '0.72rem' }}>
            {b}
          </span>
        ))}
        <span className="vp-opp-salary font-mono">
          💰 {opportunity.salary_range}
        </span>
      </div>

      {/* Description */}
      <p className="vp-opp-desc text-secondary">
        {opportunity.description}
      </p>

      {/* Matched & Missing Skills Preview */}
      <div className="vp-opp-skills-preview">
        <div className="vp-opp-matched-skills">
          <span className="vp-opp-skill-header text-success font-semibold">
            ✓ Matched Skills ({opportunity.matched_skills?.length || 0}):
          </span>
          <div className="vp-opp-skill-chips">
            {opportunity.matched_skills?.slice(0, 3).map((ms) => (
              <span key={ms} className="vp-badge vp-badge--success" style={{ fontSize: '0.7rem' }}>
                {ms}
              </span>
            ))}
            {opportunity.matched_skills?.length > 3 && (
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                +{opportunity.matched_skills.length - 3} more
              </span>
            )}
          </div>
        </div>

        {opportunity.missing_skills?.length > 0 && (
          <div className="vp-opp-missing-skills">
            <span className="vp-opp-skill-header font-semibold" style={{ color: '#FBBF24' }}>
              ⚡ Missing for 100% Match:
            </span>
            <div className="vp-opp-skill-chips">
              {opportunity.missing_skills.map((ms) => (
                <span key={ms} className="vp-badge vp-badge--warning" style={{ fontSize: '0.7rem' }}>
                  {ms}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Actions: Why Match, View Gap, View Source */}
      <div className="vp-opp-card__footer">
        <button
          className="vp-btn vp-btn--secondary vp-btn--sm"
          onClick={() => onExplain(opportunity)}
          type="button"
          aria-label={`View why ${opportunity.title} matches your speech profile`}
        >
          <span>🔍 Why this match?</span>
        </button>

        <button
          className="vp-btn vp-btn--primary vp-btn--sm glow-violet"
          onClick={() => onViewGap(opportunity.title)}
          type="button"
          aria-label={`View skill gap and upskilling path for ${opportunity.title}`}
        >
          <span>Skill Gap</span>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {opportunity.source_url && (
          <a
            href={opportunity.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="vp-btn vp-btn--ghost vp-btn--sm"
            title={`View source listing: ${opportunity.source_label || 'National Portal'}`}
            style={{ fontSize: '0.75rem' }}
          >
            <span>View Source ↗</span>
          </a>
        )}
      </div>

      {/* Mandatory Disclaimer */}
      <p className="vp-opp-card__disclaimer text-muted">
        * VoicePath Match Scores benchmark spoken competency evidence against employer specifications. Illustrative prototype for evaluation.
      </p>
    </article>
  )
}
