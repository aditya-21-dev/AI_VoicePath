import { useState, useId } from 'react'

// Language code → human-readable label
const LANG_LABELS = {
  'en':    'English',
  'en-IN': 'English (India)',
  'hi':    'Hindi',
  'es':    'Spanish',
  'fr':    'French',
  'de':    'German',
  'ar':    'Arabic',
}

/**
 * TranscriptReview — lets the user read, edit and confirm their transcript
 * before skill analysis is triggered.
 *
 * @param {{
 *   transcript: string,
 *   language: string,
 *   onConfirm: (editedTranscript: string) => void,
 *   onReRecord: () => void,
 *   isLoading: boolean,
 * }} props
 */
export default function TranscriptReview({
  transcript,
  language,
  onConfirm,
  onReRecord,
  isLoading,
}) {
  const [text, setText] = useState(transcript)
  const textareaId = useId()
  const charCount  = text.trim().length

  const langLabel = LANG_LABELS[language] ?? language

  function handleConfirm() {
    const trimmed = text.trim()
    if (trimmed) onConfirm(trimmed)
  }

  return (
    <div className="vp-transcript-review">
      {/* Header */}
      <div className="vp-transcript-review__header">
        <div>
          <div className="vp-page-title__eyebrow">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
              <line x1="7" y1="4" x2="7" y2="7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="7" cy="10" r="0.8" fill="currentColor" />
            </svg>
            Step 2 of 4
          </div>
          <h1 className="vp-transcript-review__title">Review your transcript</h1>
          <p className="vp-transcript-review__subtitle">
            This is what we heard. Fix any mistakes before we find your skills.
          </p>
        </div>

        {/* Detected language badge */}
        <div className="vp-transcript-review__lang">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="var(--text-muted)" strokeWidth="1.3" />
            <path d="M8 1c0 0-3 2.5-3 7s3 7 3 7" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M8 1c0 0 3 2.5 3 7s-3 7-3 7" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinecap="round" />
            <line x1="1.5" y1="6"  x2="14.5" y2="6"  stroke="var(--text-muted)" strokeWidth="1.3" />
            <line x1="1.5" y1="10" x2="14.5" y2="10" stroke="var(--text-muted)" strokeWidth="1.3" />
          </svg>
          <span
            className="vp-badge vp-badge--neutral"
            style={{ fontSize: '0.75rem' }}
            title={`Detected language: ${langLabel}`}
          >
            {langLabel}
          </span>
        </div>
      </div>

      {/* Editable textarea */}
      <div className="vp-transcript-review__editor-wrapper">
        <label htmlFor={textareaId} className="sr-only">
          Edit transcript
        </label>
        <textarea
          id={textareaId}
          className="vp-transcript-review__textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Transcript — you can edit this"
          disabled={isLoading}
          placeholder="Your transcript will appear here…"
          rows={6}
          spellCheck
        />
        <span
          className="vp-transcript-review__char-count"
          aria-live="polite"
          aria-label={`${charCount} characters`}
        >
          {charCount} chars
        </span>
      </div>

      {/* Info tip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
          color: '#818cf8',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
          <line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="8" cy="11.5" r="0.7" fill="currentColor" />
        </svg>
        <span>
          You can freely edit the text above. Our analysis is based on <em>what you said</em>, not technical buzzwords.
        </span>
      </div>

      {/* Action buttons */}
      <div className="vp-transcript-review__actions">
        <button
          className="vp-btn vp-btn--ghost"
          onClick={onReRecord}
          disabled={isLoading}
          type="button"
          aria-label="Go back and re-record"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8a5 5 0 1 1 1.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <polyline points="1,5 3,8 6,6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Re-record
        </button>

        <div className="vp-transcript-review__actions-right">
          <button
            id="vp-confirm-transcript-btn"
            className="vp-btn vp-btn--primary"
            onClick={handleConfirm}
            disabled={isLoading || charCount === 0}
            type="button"
            aria-label="Confirm transcript and find my skills"
          >
            {isLoading ? (
              <>
                <span
                  style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    display: 'inline-block',
                    animation: 'vp-spin 0.75s linear infinite',
                  }}
                  aria-hidden="true"
                />
                Analysing…
              </>
            ) : (
              <>
                Find my skills
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
