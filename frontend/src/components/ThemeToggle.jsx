import { useState, useEffect } from 'react'

/**
 * ThemeToggle — Global theme switcher between Light and Dark mode.
 * Features:
 *   - Defaults to Light mode
 *   - Respects system preference on first visit
 *   - Persists selection to localStorage ('vp_theme')
 *   - Applies 'data-theme' attribute on <html> element
 *   - Accessible with ARIA labels and keyboard focus
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem('vp_theme')
    if (saved === 'dark' || saved === 'light') return saved
    // Check system preference if no saved theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light' // Default to light mode
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('vp_theme', theme)
    } catch {
      // Ignore storage errors (e.g. incognito)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const isDark = theme === 'dark'

  return (
    <button
      id="vp-theme-toggle"
      className="vp-theme-toggle-btn"
      onClick={toggleTheme}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
      title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
    >
      <span className="vp-theme-toggle__track">
        <span className={`vp-theme-toggle__thumb ${isDark ? 'dark' : 'light'}`}>
          {isDark ? (
            <svg
              className="vp-theme-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg
              className="vp-theme-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="5" fill="currentColor" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </span>
      </span>
      <span className="vp-theme-toggle__label">
        {isDark ? '🌙 Dark' : '☀️ Light'}
      </span>
    </button>
  )
}
