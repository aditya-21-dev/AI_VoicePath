import { useState, useMemo } from 'react'
import SkillCard from './SkillCard.jsx'
import SkillMap from './SkillMap.jsx'

/**
 * SkillDiscovery — shows detected skills with:
 *   - Circular confidence rings
 *   - Dedicated Implicit & Hidden Skill Discovery callout card
 *   - Interactive Skill Map visualization node network
 *   - Toggle between Grid View and Skill Constellation Map View
 *
 * @param {{
 *   analysisResult: import('../data/mockData').MOCK_VOICE_ANALYSIS,
 *   onContinue: () => void,
 *   onStartOver: () => void,
 * }} props
 */
export default function SkillDiscovery({ analysisResult, onContinue, onStartOver }) {
  const [viewMode, setViewMode]     = useState('grid') // 'grid' | 'map'
  const [filterType, setFilterType] = useState('all')  // 'all' | 'explicit' | 'implicit' | 'inferred'

  const skills = useMemo(
    () => analysisResult?.profile?.skills ?? [],
    [analysisResult]
  )

  // Compute breakdown stats
  const explicit = skills.filter((s) => s.inference_type === 'explicit').length
  const implicit = skills.filter((s) => s.inference_type === 'implicit').length
  const inferred = skills.filter((s) => s.inference_type === 'inferred').length
  const avgConf  = skills.length
    ? Math.round((skills.reduce((sum, s) => sum + s.confidence, 0) / skills.length) * 100)
    : 0

  // Filter skills
  const filteredSkills = useMemo(() => {
    if (filterType === 'all') return skills
    return skills.filter((s) => s.inference_type === filterType)
  }, [skills, filterType])

  // Get inferred/implicit skills for the dedicated highlight spotlight card
  const hiddenSkills = useMemo(() => {
    return skills.filter((s) => s.inference_type === 'inferred' || s.inference_type === 'implicit')
  }, [skills])

  if (!analysisResult) return null

  return (
    <div className="vp-discovery vp-fade-in">
      {/* Page title & Eyebrow */}
      <div className="vp-page-title">
        <span className="vp-badge vp-badge--accent" style={{ marginBottom: 'var(--space-2)' }}>
          <span className="vp-stage-step__num" style={{ width: 14, height: 14, fontSize: '0.65rem', marginRight: 4 }}>3</span>
          Skills Identified &amp; Calibrated
        </span>
        <h1 className="vp-page-title__h1">
          {skills.length} vocational skills uncovered from your speech
        </h1>
        <p className="vp-page-title__sub">
          We extracted both directly mentioned machinery tasks and hidden operational competencies.
        </p>
      </div>

      {/* Summary statistics row */}
      <div className="vp-discovery__header">
        <div className="vp-discovery__summary-row" role="region" aria-label="Skill summary">
          <button
            className={`vp-stat-pill ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
            type="button"
          >
            <span className="vp-stat-pill__value">{skills.length}</span>
            <span className="vp-stat-pill__label">Total Skills</span>
          </button>

          <button
            className={`vp-stat-pill ${filterType === 'explicit' ? 'active' : ''}`}
            onClick={() => setFilterType('explicit')}
            type="button"
          >
            <span className="vp-stat-pill__value" style={{ color: '#34D399' }}>{explicit}</span>
            <span className="vp-stat-pill__label">Directly Mentioned</span>
          </button>

          <button
            className={`vp-stat-pill ${filterType === 'implicit' ? 'active' : ''}`}
            onClick={() => setFilterType('implicit')}
            type="button"
          >
            <span className="vp-stat-pill__value" style={{ color: '#FBBF24' }}>{implicit}</span>
            <span className="vp-stat-pill__label">Context Implied</span>
          </button>

          <button
            className={`vp-stat-pill ${filterType === 'inferred' ? 'active' : ''}`}
            onClick={() => setFilterType('inferred')}
            type="button"
          >
            <span className="vp-stat-pill__value" style={{ color: '#A78BFA' }}>{inferred}</span>
            <span className="vp-stat-pill__label">Experience Inferred</span>
          </button>

          <span className="vp-stat-pill">
            <span className="vp-stat-pill__value text-primary">{avgConf}%</span>
            <span className="vp-stat-pill__label">Avg. Confidence</span>
          </span>
        </div>

        {/* View Switcher Controls (Grid vs Interactive Skill Map) */}
        <div className="vp-discovery__view-toggle" role="tablist" aria-label="View layout">
          <button
            className={`vp-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            type="button"
            role="tab"
            aria-selected={viewMode === 'grid'}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span>Skill Cards</span>
          </button>

          <button
            className={`vp-view-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
            type="button"
            role="tab"
            aria-selected={viewMode === 'map'}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="4" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="8" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
            </svg>
            <span>Interactive Skill Map</span>
          </button>
        </div>
      </div>

      {/* Implicit & Hidden Skill Discovery Callout Banner */}
      <div className="vp-implicit-spotlight-card glass-card">
        <div className="vp-implicit-spotlight__header">
          <div className="vp-implicit-spotlight__badge">
            <span className="vp-sparkle-dot" />
            Hidden Competencies Unlocked
          </div>
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
            AI Latent Discovery
          </span>
        </div>

        <p className="vp-implicit-spotlight__desc">
          Traditional resumes miss up to <strong>60% of real frontline capabilities</strong>. Because you operated machines and managed stock over 4 years, VoicePath verified transferable abilities you didn&apos;t explicitly brag about:
        </p>

        <div className="vp-implicit-tags-row">
          {hiddenSkills.slice(0, 3).map((hs) => (
            <div key={hs.canonical_name} className="vp-implicit-chip">
              <span className="vp-implicit-chip-name">{hs.canonical_name}</span>
              <span className="vp-implicit-chip-conf font-mono">
                {Math.round(hs.confidence * 100)}% match
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Either Grid or Interactive Skill Map */}
      {viewMode === 'map' ? (
      <SkillMap skills={skills} profileName={analysisResult?.profile?.name ?? 'Candidate'} />
      ) : (
        <div
          className="vp-discovery__grid"
          role="list"
          aria-label="Detected skills"
        >
          {filteredSkills.map((skill, i) => (
            <div key={skill.canonical_name} role="listitem">
              <SkillCard skill={skill} animationDelay={i * 50} />
            </div>
          ))}
        </div>
      )}

      {/* Bottom navigation bar */}
      <div className="vp-discovery__bottom">
        <button
          className="vp-btn vp-btn--ghost vp-btn--lg"
          onClick={onStartOver}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8a5 5 0 1 1 1.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <polyline points="1,5 3,8 6,6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Start Over
        </button>

        <button
          id="vp-view-profile-btn"
          className="vp-btn vp-btn--primary vp-btn--lg glow-violet"
          onClick={onContinue}
          type="button"
          aria-label="View your full skill profile"
        >
          <span>Continue to Verified Profile</span>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
