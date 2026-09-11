// Maps inference_type → human-readable label and colour tokens
const TYPE_META = {
  explicit: {
    label: 'Directly mentioned',
    dotClass: 'vp-legend-dot--explicit',
    badgeStyle: { background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' },
    fillClass: 'vp-skill-card__bar-fill--explicit',
  },
  implicit: {
    label: 'Implied by context',
    dotClass: 'vp-legend-dot--implicit',
    badgeStyle: { background: 'rgba(234,179,8,0.12)', color: '#facc15', border: '1px solid rgba(234,179,8,0.3)' },
    fillClass: 'vp-skill-card__bar-fill--implicit',
  },
  inferred: {
    label: 'Inferred from role',
    dotClass: 'vp-legend-dot--inferred',
    badgeStyle: { background: 'rgba(139,92,246,0.16)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.4)' },
    fillClass: 'vp-skill-card__bar-fill--inferred',
  },
}

/**
 * EvidenceCard — shows the quoted raw phrase plus the "Why was this detected?" explanation.
 * Rendered inside SkillCard's collapsible panel.
 *
 * @param {{ skill: import('../data/mockData').MOCK_SKILLS[0] }} props
 */
export default function EvidenceCard({ skill }) {
  const meta = TYPE_META[skill.inference_type] ?? TYPE_META.inferred

  return (
    <div className="vp-evidence-card" role="region" aria-label={`Evidence for ${skill.canonical_name}`}>
      {/* Quoted raw phrase */}
      <div className="vp-evidence-card__quote-wrapper">
        <span className="vp-evidence-card__quotemark" aria-hidden="true">&ldquo;</span>
        <p className="vp-evidence-card__quote">
          {skill.raw_phrase}
          <span aria-hidden="true" style={{ color: 'var(--accent)', marginLeft: 2 }}>&rdquo;</span>
        </p>
      </div>

      <div className="vp-evidence-card__rule" />

      {/* Why was this skill detected? */}
      <div>
        <p className="vp-evidence-card__section-label">Why was this detected?</p>
        <p className="vp-evidence-card__explanation">{skill.evidence}</p>
      </div>

      {/* Detection method badge */}
      <div className="vp-evidence-card__type-row">
        <span className="vp-legend-dot" style={{
          width: 7, height: 7, borderRadius: '50%',
          background: meta.badgeStyle.color, flexShrink: 0,
        }} />
        <span className="vp-evidence-card__type-label">Detection method:</span>
        <span
          className="vp-badge"
          style={{ ...meta.badgeStyle, textTransform: 'capitalize', fontSize: '0.7rem', padding: '2px 8px' }}
        >
          {meta.label}
        </span>
      </div>
    </div>
  )
}
