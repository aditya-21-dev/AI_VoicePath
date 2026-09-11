import SkillAnalytics from './SkillAnalytics.jsx'

// Fill colours by inference type — deliberately human-readable (no AI jargon)
const FILL_BY_TYPE = {
  explicit: 'linear-gradient(90deg,#16a34a,#4ade80)',
  implicit: 'linear-gradient(90deg,#ca8a04,#fde047)',
  inferred: 'linear-gradient(90deg,var(--accent),var(--accent-hover))',
}

const GROUP_META = {
  explicit: {
    heading: 'Clearly demonstrated',
    dotColor: '#4ade80',
    description: 'Skills you directly described in your own words.',
  },
  implicit: {
    heading: 'Shown through your work',
    dotColor: '#facc15',
    description: 'Skills we picked up from the activities you described.',
  },
  inferred: {
    heading: 'Likely from your experience',
    dotColor: 'var(--accent-hover)',
    description: 'Skills commonly associated with your role and background.',
  },
}

/**
 * SkillProfile — clean, jargon-free summary of the detected profile.
 * Groups skills by how they were detected, uses plain English throughout.
 *
 * @param {{
 *   analysisResult: import('../data/mockData').MOCK_VOICE_ANALYSIS,
 *   onStartOver: () => void,
 *   onFindJobs: () => void,
 * }} props
 */
export default function SkillProfile({ analysisResult, onStartOver, onFindJobs }) {
  if (!analysisResult) return null

  const { profile } = analysisResult
  const skills = profile.skills ?? []

  const grouped = {
    explicit: skills.filter((s) => s.inference_type === 'explicit'),
    implicit: skills.filter((s) => s.inference_type === 'implicit'),
    inferred: skills.filter((s) => s.inference_type === 'inferred'),
  }

  // Pick an emoji avatar based on domain
  const avatarEmoji =
    profile.domain?.toLowerCase().includes('textile') ||
    profile.domain?.toLowerCase().includes('apparel') ||
    profile.domain?.toLowerCase().includes('garment')
      ? '🧵'
      : profile.domain?.toLowerCase().includes('data')
      ? '📊'
      : profile.domain?.toLowerCase().includes('sales')
      ? '📈'
      : profile.domain?.toLowerCase().includes('retail')
      ? '🛍️'
      : '🎯'

  const topSkill = [...skills].sort((a, b) => b.confidence - a.confidence)[0]

  return (
    <div className="vp-profile-view">
      {/* Hero card */}
      <div className="vp-profile-hero">
        <div className="vp-profile-hero__avatar" aria-hidden="true">
          {avatarEmoji}
        </div>

        <div className="vp-profile-hero__info">
          <h1 className="vp-profile-hero__name">{profile.name}</h1>
          <div className="vp-profile-hero__meta">
            {profile.domain && (
              <span
                className="vp-badge vp-badge--accent"
                style={{ fontSize: '0.8rem' }}
              >
                {profile.domain}
              </span>
            )}
            {profile.seniority && (
              <span
                className="vp-badge vp-badge--neutral"
                style={{ fontSize: '0.8rem' }}
              >
                {profile.seniority}
              </span>
            )}
          </div>

          {profile.summary && (
            <p
              style={{
                marginTop: 'var(--space-4)',
                fontSize: '0.9375rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                maxWidth: 520,
              }}
            >
              {profile.summary}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="vp-profile-stats" role="region" aria-label="Profile statistics">
        <div className="vp-profile-stat">
          <p className="vp-profile-stat__value accent">
            {profile.experience_years}
          </p>
          <p className="vp-profile-stat__label">Years of experience</p>
        </div>

        <div className="vp-profile-stat">
          <p className="vp-profile-stat__value primary">{skills.length}</p>
          <p className="vp-profile-stat__label">Skills identified</p>
        </div>

        <div className="vp-profile-stat">
          <p className="vp-profile-stat__value accent">
            {topSkill ? Math.round(topSkill.confidence * 100) : 0}%
          </p>
          <p className="vp-profile-stat__label">Top skill confidence</p>
        </div>
      </div>

      {/* Grouped skills card */}
      <div className="vp-profile-skills-card">
        <div className="vp-profile-skills-card__header">
          <h2 className="vp-profile-skills-card__title">Your skills breakdown</h2>
          <span
            className="vp-badge vp-badge--neutral"
            style={{ fontSize: '0.75rem' }}
          >
            {skills.length} total
          </span>
        </div>

        {(['explicit', 'implicit', 'inferred']).map((type) => {
          const group = grouped[type]
          if (!group.length) return null
          const meta = GROUP_META[type]

          return (
            <div key={type} className="vp-profile-skill-group">
              <div className="vp-profile-skill-group__heading">
                <span
                  className="vp-profile-skill-group__dot"
                  style={{ background: meta.dotColor }}
                />
                {meta.heading}
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    fontWeight: 400,
                    textTransform: 'none',
                    letterSpacing: 0,
                  }}
                >
                  {meta.description}
                </span>
              </div>

              {group.map((skill) => {
                const pct = Math.round(skill.confidence * 100)
                return (
                  <div key={skill.canonical_name} className="vp-profile-skill-row">
                    <span className="vp-profile-skill-name">{skill.canonical_name}</span>
                    <div className="vp-profile-skill-bar" role="presentation">
                      <div
                        className="vp-profile-skill-bar__fill"
                        style={{
                          width: `${pct}%`,
                          background: FILL_BY_TYPE[type],
                        }}
                      />
                    </div>
                    <span className="vp-profile-skill-pct">{pct}%</span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Recharts Visual Intelligence Analytics */}
      <div style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <SkillAnalytics skills={skills} />
      </div>

      {/* Confidence note — no AI jargon */}
      <p
        style={{
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          lineHeight: 1.65,
          maxWidth: 560,
          margin: '0 auto',
        }}
      >
        Confidence scores reflect how clearly each skill came through in your own words.
        Higher scores mean the skill was mentioned directly; lower scores are still valid but came through less explicitly.
      </p>

      {/* CTA buttons */}
      <div className="vp-profile-cta">
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
          id="vp-find-jobs-btn"
          className="vp-btn vp-btn--primary vp-btn--lg"
          onClick={onFindJobs}
          type="button"
        >
          Find matching jobs
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
