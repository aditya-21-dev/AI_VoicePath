import { useState, useEffect } from 'react'
import LanguageSelector from './LanguageSelector.jsx'

const STAGES = ['intake', 'reviewing', 'discovering', 'profile', 'opportunities']

const STAGE_LABELS = {
  intake:        'Voice Intake',
  reviewing:     'Review Speech',
  discovering:   'Skills Found',
  profile:       'Skill Profile',
  opportunities: 'Jobs & Upskill',
}

// Mic icon inline SVG
function BrandIcon() {
  return (
    <div className="vp-brand-icon-box">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
        <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="9"  y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

// Check icon for completed steps
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Header — App navigation bar.
 * Includes:
 *   - Live AI status indicator
 *   - Step progress navigator
 *   - Multilingual language selector
 *   - Accessibility (high-contrast) toggle
 *   - User avatar badge with glow
 *
 * @param {{
 *   stage: string,
 *   language: string,
 *   onLanguageChange: (code: string) => void
 * }} props
 */
export default function Header({ stage, language, onLanguageChange }) {
  const currentIdx = STAGES.indexOf(stage)
  const [highContrast, setHighContrast] = useState(false)

  // Toggle high contrast theme class on document body
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('vp-high-contrast')
    } else {
      document.body.classList.remove('vp-high-contrast')
    }
  }, [highContrast])

  return (
    <header className="vp-nav" role="banner">
      {/* Brand + Live Status */}
      <div className="vp-nav__left">
        <div className="vp-nav__brand" aria-label="VoicePath home">
          <BrandIcon />
          <span>
            Voice<span className="vp-nav__brand-accent">Path</span>
          </span>
        </div>

        {/* Live AI engine status badge */}
        <div
          className="vp-live-status-badge"
          title="VoicePath Realtime NLP Engine is online"
          role="status"
          aria-live="polite"
        >
          <span className="vp-live-dot" />
          <span className="vp-live-text">AI Ready</span>
        </div>
      </div>

      {/* Step indicator */}
      <nav className="vp-stage-nav" aria-label="Progress">
        {STAGES.map((s, i) => {
          const isDone    = i < currentIdx
          const isCurrent = i === currentIdx
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                className={[
                  'vp-stage-step',
                  isCurrent ? 'current' : '',
                  isDone    ? 'done'    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={isCurrent ? 'step' : undefined}
                title={STAGE_LABELS[s]}
              >
                <span className="vp-stage-step__num">
                  {isDone ? <CheckIcon /> : i + 1}
                </span>
                <span className="vp-stage-step__label">{STAGE_LABELS[s]}</span>
              </div>

              {/* Connector line */}
              {i < STAGES.length - 1 && (
                <span className={`vp-stage-connector ${isDone ? 'done' : ''}`} aria-hidden="true" />
              )}
            </div>
          )
        })}
      </nav>

      {/* Actions: Accessibility Toggle + Language + Avatar */}
      <div className="vp-nav__right">
        {/* Accessibility contrast toggle */}
        <button
          className={`vp-a11y-btn ${highContrast ? 'active' : ''}`}
          onClick={() => setHighContrast((h) => !h)}
          type="button"
          aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
          title={highContrast ? 'High Contrast: Active' : 'Toggle High Contrast & Clarity Mode'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 2a10 10 0 0 1 0 20V2z" fill="currentColor" />
          </svg>
          <span className="vp-a11y-label">A11y</span>
        </button>

        {/* Language selector */}
        <LanguageSelector value={language} onChange={onLanguageChange} />

        {/* Avatar with status indicator */}
        <div
          className="vp-user-avatar-badge"
          title="Demo Profile: Priya Sharma (Textile Specialist)"
          tabIndex={0}
          role="button"
          aria-label="User profile: Priya Sharma"
        >
          <div className="vp-user-avatar-ring">
            <span className="vp-avatar-emoji" aria-hidden="true">🧵</span>
          </div>
          <span className="vp-avatar-status-dot" aria-hidden="true" />
        </div>
      </div>
    </header>
  )
}
