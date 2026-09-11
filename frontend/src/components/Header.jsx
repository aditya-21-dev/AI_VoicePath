import LanguageSelector from './LanguageSelector.jsx'

const STAGES = ['intake', 'reviewing', 'discovering', 'profile']

const STAGE_LABELS = {
  intake:      'Voice Intake',
  reviewing:   'Review',
  discovering: 'Skills Found',
  profile:     'Your Profile',
}

// Mic icon inline SVG
function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" opacity="0.85" />
      <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="9"  y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
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
 * Header — sticky top nav with brand, step indicator and language selector.
 *
 * @param {{
 *   stage: string,
 *   language: string,
 *   onLanguageChange: (code: string) => void
 * }} props
 */
export default function Header({ stage, language, onLanguageChange }) {
  const currentIdx = STAGES.indexOf(stage)

  return (
    <header className="vp-nav" role="banner">
      {/* Brand */}
      <div className="vp-nav__brand" aria-label="VoicePath home">
        <MicIcon />
        Voice<span className="vp-nav__brand-accent">Path</span>
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

              {/* Connector line between steps */}
              {i < STAGES.length - 1 && (
                <span className="vp-stage-connector" aria-hidden="true" />
              )}
            </div>
          )
        })}
      </nav>

      {/* Language selector */}
      <LanguageSelector value={language} onChange={onLanguageChange} />
    </header>
  )
}
