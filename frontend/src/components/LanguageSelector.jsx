import { useState, useRef, useEffect } from 'react'

const LANGUAGES = [
  { code: 'en',    label: 'English',          flag: '🇬🇧' },
  { code: 'en-IN', label: 'English (India)',   flag: '🇮🇳' },
  { code: 'hi',    label: 'हिंदी (Hindi)',       flag: '🇮🇳' },
  { code: 'es',    label: 'Español',           flag: '🇪🇸' },
  { code: 'fr',    label: 'Français',          flag: '🇫🇷' },
  { code: 'de',    label: 'Deutsch',           flag: '🇩🇪' },
  { code: 'ar',    label: 'العربية',            flag: '🇸🇦' },
]

/**
 * LanguageSelector — dropdown for interview language.
 *
 * @param {{ value: string, onChange: (code: string) => void }} props
 */
export default function LanguageSelector({ value = 'en-IN', onChange }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const selected = LANGUAGES.find((l) => l.code === value) ?? LANGUAGES[1]

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="vp-lang-selector" ref={containerRef}>
      <button
        id="lang-selector-trigger"
        className="vp-lang-selector__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${selected.label}`}
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <span aria-hidden="true">{selected.flag}</span>
        <span>{selected.label}</span>
        {/* Chevron */}
        <svg
          className={`vp-lang-selector__chevron${open ? ' open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          className="vp-lang-selector__menu"
          role="listbox"
          aria-labelledby="lang-selector-trigger"
        >
          {LANGUAGES.map((lang) => (
            <li key={lang.code} role="option" aria-selected={lang.code === value}>
              <button
                className={`vp-lang-selector__item${lang.code === value ? ' active' : ''}`}
                onClick={() => {
                  onChange?.(lang.code)
                  setOpen(false)
                }}
                type="button"
              >
                <span aria-hidden="true">{lang.flag}</span>
                <span>{lang.label}</span>
                {lang.code === value && (
                  <svg
                    style={{ marginLeft: 'auto' }}
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M2.5 7l3.5 3.5 5.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
