import { useEffect, useState } from 'react'

// ── Nav item icon SVGs ──────────────────────────────────────────────────────────
function IconHome({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinejoin="round"
        fill={active ? 'rgba(139,92,246,0.18)' : 'none'}
      />
      <rect x="9" y="13" width="6" height="8" rx="1" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function IconSkills({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} />
      <path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinecap="round"
      />
      <circle cx="19" cy="8" r="2.5" fill={active ? 'var(--accent-secondary)' : 'none'} stroke="var(--accent-secondary)" strokeWidth="1.4" />
      <path d="M19 6.5v3M17.5 8h3" stroke="var(--bg-base)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

function IconOpportunities({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} fill={active ? 'rgba(6,182,212,0.12)' : 'none'} />
      <path d="M8 7V5a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" />
      <circle cx="12" cy="14" r="2" fill="currentColor" />
    </svg>
  )
}

function IconPath({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="5" cy="19" r="2.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} />
      <circle cx="19" cy="5" r="2.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} />
      <path d="M7 17.5l3.5-3.5M14.5 10l3-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray={active ? 'none' : '2 2'} />
    </svg>
  )
}

function IconProfile({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} fill={active ? 'rgba(139,92,246,0.15)' : 'none'} />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" />
    </svg>
  )
}

// Stage → tab mapping
const STAGE_TO_TAB = {
  intake:        'home',
  reviewing:     'home',
  discovering:   'skills',
  profile:       'profile',
  opportunities: 'opportunities',
}

const NAV_ITEMS = [
  { id: 'home',          label: 'Home',     Icon: IconHome },
  { id: 'skills',        label: 'Skills',   Icon: IconSkills },
  { id: 'opportunities', label: 'Jobs',     Icon: IconOpportunities },
  { id: 'path',          label: 'Path',     Icon: IconPath },
  { id: 'profile',       label: 'Profile',  Icon: IconProfile },
]

// Stage jump targets on tap
const TAB_TO_STAGE = {
  home:          null,   // goes to onStartOver
  skills:        'discovering',
  opportunities: 'opportunities',
  path:          'opportunities',   // deep-links to path tab via state
  profile:       'profile',
}

/**
 * MobileNav — Fixed bottom navigation bar for mobile / tablet viewports.
 *
 * Features:
 *   - 5-tab layout: Home, Skills, Jobs, Path, Profile
 *   - Safe-area inset bottom awareness (iOS notch / home bar)
 *   - Touch-friendly large hit targets (min 56px height)
 *   - Active tab indicator with glowing accent underline
 *   - "Simple View" accessibility toggle (high-contrast mode)
 *   - Smooth icon scale + label fade micro-animations
 *   - Hidden on desktop (CSS media query)
 *
 * @param {{
 *   stage: string,
 *   onNavigate?: (stage: string) => void,
 *   onStartOver?: () => void,
 *   simpleView?: boolean,
 *   onToggleSimpleView?: () => void,
 * }} props
 */
export default function MobileNav({
  stage,
  onNavigate,
  onStartOver,
  simpleView = false,
  onToggleSimpleView,
}) {
  const activeTab = STAGE_TO_TAB[stage] ?? 'home'
  const [rippleId, setRippleId] = useState(null)

  // Apply simple-view class to body
  useEffect(() => {
    if (simpleView) {
      document.body.classList.add('vp-simple-view')
    } else {
      document.body.classList.remove('vp-simple-view')
    }
  }, [simpleView])

  function handleTap(item) {
    setRippleId(item.id)
    setTimeout(() => setRippleId(null), 400)

    if (item.id === 'home') {
      onStartOver?.()
      return
    }
    const targetStage = TAB_TO_STAGE[item.id]
    if (targetStage) onNavigate?.(targetStage)
  }

  return (
    <nav
      className="vp-mobile-nav"
      role="navigation"
      aria-label="Mobile navigation"
    >
      {/* Intelligence Trail accent line at top of bar */}
      <div className="vp-mobile-nav__trail" aria-hidden="true" />

      {/* Nav items */}
      <div className="vp-mobile-nav__items">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeTab
          const hasRipple = rippleId === item.id
          return (
            <button
              key={item.id}
              className={[
                'vp-mobile-nav__item',
                isActive ? 'active' : '',
                hasRipple ? 'ripple' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleTap(item)}
              type="button"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="vp-mobile-nav__icon-wrap">
                <item.Icon active={isActive} />
                {/* Active glow dot */}
                {isActive && <span className="vp-mobile-nav__active-dot" aria-hidden="true" />}
              </span>
              <span className="vp-mobile-nav__label">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Simple View toggle pill — floats above the nav bar */}
      <button
        className={`vp-simple-view-toggle ${simpleView ? 'active' : ''}`}
        onClick={onToggleSimpleView}
        type="button"
        aria-label={simpleView ? 'Disable Simple View' : 'Enable Simple View (Accessibility)'}
        title="Toggle Simple / Accessibility View"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 2a10 10 0 0 1 0 20V2z" fill="currentColor" />
        </svg>
        <span>{simpleView ? 'Simple ON' : 'A11y'}</span>
      </button>
    </nav>
  )
}
