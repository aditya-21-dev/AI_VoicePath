import { useState, useId } from 'react'

// Language code → human-readable label
const LANG_LABELS = {
  'en':    'English',
  'en-IN': 'English (India)',
  'hi':    'Hindi (हिंदी)',
  'ta':    'Tamil (தமிழ்)',
  'te':    'Telugu (తెలుగు)',
  'ml':    'Malayalam (മലയാളം)',
  'kn':    'Kannada (ಕನ್ನಡ)',
  'auto':  'Multilingual (2 languages)',
}

/**
 * TranscriptReview — lets user review their real transcript, view faithful English
 * translation for non-English speech (e.g. Tamil), and edit/re-record before profile extraction.
 *
 * @param {{
 *   transcript: string,
 *   translation?: string | null,
 *   language: string,
 *   asrConfidence?: number,
 *   onConfirm: (editedTranscript: string) => void,
 *   onReRecord: () => void,
 *   isLoading: boolean,
 * }} props
 */
export default function TranscriptReview({
  transcript,
  translation,
  language,
  asrConfidence,
  onConfirm,
  onReRecord,
  isLoading,
}) {
  const [prevTranscript, setPrevTranscript] = useState(transcript)
  const [text, setText]                     = useState(transcript || '')
  const [isEditing, setIsEditing]           = useState(false)
  const textareaId                          = useId()

  // Sync state if incoming transcript changes from parent
  if (transcript !== prevTranscript) {
    setPrevTranscript(transcript)
    setText(transcript || '')
  }

  const charCount = text.trim().length
  const langLabel = LANG_LABELS[language] ?? language

  function handleConfirm() {
    const trimmed = text.trim()
    if (trimmed) onConfirm(trimmed)
  }

  return (
    <div className="vp-transcript-review vp-fade-in">
      {/* Header */}
      <div className="vp-transcript-review__header">
        <div>
          <span className="vp-badge vp-badge--accent" style={{ marginBottom: 'var(--space-2)' }}>
            <span className="vp-stage-step__num" style={{ width: 14, height: 14, fontSize: '0.65rem', marginRight: 4 }}>2</span>
            Acoustic &amp; Semantic Verification
          </span>
          <h1 className="vp-transcript-review__title">Review your speech transcript</h1>
          <p className="vp-transcript-review__subtitle">
            Verify your spoken transcript below before proceeding to skill discovery. You can edit the text if needed.
          </p>
        </div>

        {/* Language & mode pills */}
        <div className="vp-review-header-badges">
          <span className="vp-badge vp-badge--neutral" title={`Acoustic language: ${langLabel}`}>
            🌐 {langLabel}
          </span>
          {asrConfidence !== undefined && asrConfidence !== null && (
            <span className="vp-badge vp-badge--cyan" title="Backend ASR confidence-like score">
              ASR confidence {asrConfidence}
            </span>
          )}
          <button
            className={`vp-btn vp-btn--ghost vp-btn--sm ${isEditing ? 'active' : ''}`}
            onClick={() => setIsEditing((e) => !e)}
            type="button"
            aria-pressed={isEditing}
          >
            {isEditing ? '👁️ View Transcript' : '✏️ Edit Text'}
          </button>
        </div>
      </div>

      {/* Main Review Card */}
      <div className="vp-review-container glass-card">
        {isEditing ? (
          <div className="vp-transcript-viewer">
            <div className="vp-transcript-review__editor-wrapper">
              <label htmlFor={textareaId} className="sr-only">
                Edit transcript
              </label>
              <textarea
                id={textareaId}
                className="vp-transcript-review__textarea font-sans"
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="Edit transcript text"
                disabled={isLoading}
                placeholder="Your spoken transcript appears here…"
                rows={5}
                spellCheck
                autoFocus
              />
              <span className="vp-transcript-review__char-count font-mono" aria-live="polite">
                {charCount} chars
              </span>
            </div>

            {translation && (
              <div className="vp-translation-editor-ref" style={{ marginTop: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <span className="vp-badge vp-badge--accent" style={{ fontSize: '0.75rem' }}>
                    English Translation Reference
                  </span>
                </div>
                <div className="vp-highlighted-display" aria-label="English translation reference">
                  <p className="vp-highlighted-quote" style={{ fontSize: '0.95rem', margin: 0, fontStyle: 'italic', opacity: 0.9 }}>
                    &ldquo;{translation}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="vp-transcript-viewer">
            {/* Original Transcript */}
            <div className="vp-transcript-section" style={{ marginBottom: translation ? 'var(--space-5)' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <span className="vp-badge vp-badge--neutral" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  Original Transcript
                </span>
                {language === 'ta' && (
                  <span className="text-secondary" style={{ fontSize: '0.75rem' }}>
                    (Tamil)
                  </span>
                )}
              </div>
              <div className="vp-highlighted-display" aria-label="Original speech transcript">
                <blockquote className="vp-highlighted-quote">
                  &ldquo;{text || 'No transcript yet'}&rdquo;
                </blockquote>
              </div>
            </div>

            {/* English Translation (when available for Tamil speech) */}
            {translation && (
              <div className="vp-translation-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <span className="vp-badge vp-badge--accent" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    English Translation
                  </span>
                </div>
                <div className="vp-highlighted-display" aria-label="English translation">
                  <blockquote className="vp-highlighted-quote">
                    &ldquo;{translation}&rdquo;
                  </blockquote>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation Controls */}
      <div className="vp-transcript-review__actions">
        <button
          className="vp-btn vp-btn--ghost vp-btn--lg"
          onClick={onReRecord}
          type="button"
          disabled={isLoading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Re-record Audio
        </button>

        <button
          id="vp-confirm-transcript-btn"
          className="vp-btn vp-btn--primary vp-btn--lg glow-violet"
          onClick={handleConfirm}
          disabled={!text.trim() || isLoading}
          type="button"
        >
          {isLoading ? (
            <>
              <span className="vp-spinner" style={{ width: 16, height: 16 }} />
              <span>Analyzing speech…</span>
            </>
          ) : (
            <>
              <span>Looks good — Discover My Skills</span>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
