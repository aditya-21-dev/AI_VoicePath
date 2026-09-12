/**
 * Toast notification component for user feedback across screens.
 * @param {{
 *   message: string,
 *   type?: 'success'|'info'|'warning',
 *   onClose: () => void
 * }} props
 */
export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null

  return (
    <div className={`vp-toast vp-toast--${type} vp-fade-in`} role="alert" aria-live="assertive">
      <div className="vp-toast__icon">
        {type === 'success' ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="8" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5.5 9l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="9" y1="5" x2="9" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="9" cy="12.5" r="0.8" fill="currentColor" />
          </svg>
        )}
      </div>

      <p className="vp-toast__msg">{message}</p>

      <button
        className="vp-toast__close"
        onClick={onClose}
        type="button"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  )
}
