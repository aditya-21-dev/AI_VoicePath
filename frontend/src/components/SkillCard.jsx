import { useState } from 'react'
import EvidenceCard from './EvidenceCard.jsx'

// Badge colours per inference_type
const TYPE_STYLE = {
  explicit: {
    badgeStyle:  { background: 'rgba(34,197,94,0.12)',  color: '#4ade80',  border: '1px solid rgba(34,197,94,0.3)' },
    fillClass:   'vp-skill-card__bar-fill--explicit',
    badgeLabel:  'Mentioned',
  },
  implicit: {
    badgeStyle:  { background: 'rgba(234,179,8,0.12)', color: '#facc15', border: '1px solid rgba(234,179,8,0.3)' },
    fillClass:   'vp-skill-card__bar-fill--implicit',
    badgeLabel:  'Implied',
  },
  inferred: {
    badgeStyle:  { background: 'rgba(229,52,58,0.15)', color: '#ff4a50', border: '1px solid rgba(229,52,58,0.4)' },
    fillClass:   'vp-skill-card__bar-fill--inferred',
    badgeLabel:  'Inferred',
  },
}

// Chevron icon
function ChevronIcon({ open }) {
  return (
    <svg
      className="vp-skill-card__toggle-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * SkillCard — shows a single detected skill with confidence bar and
 * a collapsible "Why was this detected?" evidence panel.
 *
 * @param {{
 *   skill: import('../data/mockData').MOCK_SKILLS[0],
 *   animationDelay?: number
 * }} props
 */
export default function SkillCard({ skill, animationDelay = 0 }) {
  const [evidenceOpen, setEvidenceOpen] = useState(false)

  const meta       = TYPE_STYLE[skill.inference_type] ?? TYPE_STYLE.inferred
  const pct        = Math.round(skill.confidence * 100)
  const cardId     = `skill-card-${skill.canonical_name.replace(/\s+/g, '-').toLowerCase()}`
  const evidenceId = `${cardId}-evidence`

  return (
    <article
      className="vp-skill-card"
      id={cardId}
      style={{ animationDelay: `${animationDelay}ms` }}
      aria-label={`${skill.canonical_name}, ${pct}% confidence`}
    >
      <div className="vp-skill-card__body">
        {/* Header row: name + inference badge */}
        <div className="vp-skill-card__header">
          <h3 className="vp-skill-card__name">{skill.canonical_name}</h3>
          <span
            className="vp-badge"
            style={{
              ...meta.badgeStyle,
              fontSize: '0.7rem',
              padding: '3px 9px',
              borderRadius: '999px',
              fontWeight: 600,
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {meta.badgeLabel}
          </span>
        </div>

        {/* Confidence bar */}
        <div>
          <div className="vp-skill-card__conf-label-row">
            <span className="vp-skill-card__conf-text">Match confidence</span>
            <span className="vp-skill-card__conf-pct">{pct}%</span>
          </div>
          <div className="vp-skill-card__bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={`vp-skill-card__bar-fill ${meta.fillClass}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* "Why was this detected?" toggle */}
      <button
        className={`vp-skill-card__toggle${evidenceOpen ? ' open' : ''}`}
        onClick={() => setEvidenceOpen((o) => !o)}
        aria-expanded={evidenceOpen}
        aria-controls={evidenceId}
        type="button"
      >
        <span>
          {evidenceOpen ? 'Hide explanation' : 'Why was this skill detected?'}
        </span>
        <ChevronIcon open={evidenceOpen} />
      </button>

      {/* Collapsible evidence panel */}
      <div
        id={evidenceId}
        className={`vp-skill-card__evidence-panel${evidenceOpen ? ' open' : ''}`}
        aria-hidden={!evidenceOpen}
      >
        <EvidenceCard skill={skill} />
      </div>
    </article>
  )
}
