import { useState } from 'react'
import EvidenceCard from './EvidenceCard.jsx'
import ConfidenceRing from './ConfidenceRing.jsx'

// Badge colours & styles per inference_type
const TYPE_STYLE = {
  explicit: {
    badgeStyle:  { background: 'rgba(16, 185, 129, 0.14)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.35)' },
    ringGradient: ['#10B981', '#34D399'],
    badgeLabel:  'Directly Mentioned',
    dotColor:    '#10B981',
  },
  implicit: {
    badgeStyle:  { background: 'rgba(245, 158, 11, 0.14)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.35)' },
    ringGradient: ['#D97706', '#FBBF24'],
    badgeLabel:  'Context Implied',
    dotColor:    '#F59E0B',
  },
  inferred: {
    badgeStyle:  { background: 'rgba(139, 92, 246, 0.16)', color: '#A78BFA', border: '1px solid rgba(139, 92, 246, 0.4)' },
    ringGradient: ['#7C3AED', '#A78BFA'],
    badgeLabel:  'Experience Inferred',
    dotColor:    '#8B5CF6',
  },
}


/**
 * SkillCard — shows a single detected skill with circular Confidence Ring,
 * inference classification, and a collapsible evidence panel.
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
      className="vp-skill-card glass-card"
      id={cardId}
      style={{ animationDelay: `${animationDelay}ms` }}
      aria-label={`${skill.canonical_name}, ${pct}% confidence, ${meta.badgeLabel}`}
    >
      <div className="vp-skill-card__body">
        {/* Top row: Name and Circular Confidence Ring */}
        <div className="vp-skill-card__top-row">
          <div className="vp-skill-card__heading">
            <h3 className="vp-skill-card__name">{skill.canonical_name}</h3>
            {skill.category && (
              <span className="vp-skill-card__category text-muted">
                {skill.category}
              </span>
            )}
          </div>

          <ConfidenceRing pct={pct} size={50} />
        </div>

        {/* Inference classification badge */}
        <div className="vp-skill-card__badge-row">
          <span
            className="vp-badge"
            style={{
              ...meta.badgeStyle,
              fontSize: '0.72rem',
              padding: '3px 10px',
              borderRadius: '999px',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: meta.dotColor,
                display: 'inline-block',
                marginRight: 4,
              }}
            />
            {meta.badgeLabel}
          </span>
        </div>
      </div>

      {/* "Why was this detected?" collapsible toggle */}
      <button
        className={`vp-skill-card__toggle ${evidenceOpen ? 'open' : ''}`}
        onClick={() => setEvidenceOpen((o) => !o)}
        aria-expanded={evidenceOpen}
        aria-controls={evidenceId}
        type="button"
      >
        <span>
          {evidenceOpen ? 'Hide Evidence & Reasoning' : 'Why was this skill detected?'}
        </span>
        <svg
          className="vp-skill-card__toggle-icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          style={{
            transform: evidenceOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms ease',
          }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Collapsible evidence panel */}
      {evidenceOpen && (
        <div
          id={evidenceId}
          className="vp-skill-card__evidence-panel open"
        >
          <EvidenceCard skill={skill} />
        </div>
      )}
    </article>
  )
}
