import { useState, useId, useMemo } from 'react'

// Language code → human-readable label
const LANG_LABELS = {
  'en':    'English',
  'en-IN': 'English (India)',
  'hi':    'Hindi (हिंदी)',
  'ta':    'Tamil (தமிழ்)',
  'te':    'Telugu (తెలుగు)',
  'ml':    'Malayalam (മലയാളം)',
  'kn':    'Kannada (ಕನ್ನಡ)',
}

// Canonical phrase mapping definitions for smart highlighting & skill tagging
const HIGHLIGHT_RULES = [
  {
    regex: /worked in a textile shop for four years/i,
    phrase: 'worked in a textile shop for four years',
    tag: 'Work Tenure & Domain',
    category: 'domain',
    skill: 'Textile Domain & Quality Knowledge',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.22)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
    explanation: '4-year continuous tenure with apparel textiles implies deep fabric familiarity and workplace reliability.',
  },
  {
    regex: /operate sewing machines/i,
    phrase: 'operate sewing machines',
    tag: 'Machinery & Assembly',
    category: 'technical',
    skill: 'Industrial Sewing Machine Operation',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.22)',
    borderColor: 'rgba(6, 182, 212, 0.5)',
    explanation: 'Direct statement indicating regular operation of stitching and industrial garment assembly machinery.',
  },
  {
    regex: /manage stock/i,
    phrase: 'manage stock',
    tag: 'Inventory Control',
    category: 'logistics',
    skill: 'Inventory & Stock Management',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.22)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
    explanation: 'Direct responsibility for fabric storage, shrinkage mitigation, SKU tracking, and inventory counts.',
  },
  {
    regex: /handle customers/i,
    phrase: 'handle customers',
    tag: 'Customer Service',
    category: 'interpersonal',
    skill: 'Customer Relationship Management',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.22)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
    explanation: 'Frontline customer engagement, product consultation, billing assistance, and customer care.',
  },
  // Tech persona fallbacks
  {
    regex: /python/i,
    phrase: 'Python',
    tag: 'Programming',
    category: 'technical',
    skill: 'Python Development',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.22)',
    borderColor: 'rgba(6, 182, 212, 0.5)',
    explanation: 'Scripting and data transformation in Python.',
  },
  {
    regex: /machine learning|ml models/i,
    phrase: 'Machine Learning',
    tag: 'AI & Modeling',
    category: 'technical',
    skill: 'Machine Learning Systems',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.22)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
    explanation: 'Model development and predictive analytics.',
  },
]

/**
 * TranscriptReview — lets user review their transcript with interactive phrase highlighting,
 * evidence inspector tooltips, and edit/re-record capabilities.
 *
 * @param {{
 *   transcript: string,
 *   language: string,
 *   asrConfidence?: number,
 *   onConfirm: (editedTranscript: string) => void,
 *   onReRecord: () => void,
 *   isLoading: boolean,
 * }} props
 */
export default function TranscriptReview({
  transcript,
  language,
  asrConfidence,
  onConfirm,
  onReRecord,
  isLoading,
}) {
  const [text, setText]               = useState(transcript)
  const [isEditing, setIsEditing]     = useState(false)
  const [selectedHighlight, setSelectedHighlight] = useState(HIGHLIGHT_RULES[0])
  const textareaId                    = useId()
  const charCount                     = text.trim().length
  const langLabel                     = LANG_LABELS[language] ?? language

  // Discover matching highlighted phrases in current text
  const detectedTags = useMemo(() => {
    return HIGHLIGHT_RULES.filter((rule) => rule.regex.test(text))
  }, [text])

  // Parse text into tokens with highlight markup
  const renderedHighlightedText = useMemo(() => {
    if (!text) return null

    // Find all matches with start and end indices
    let matches = []
    HIGHLIGHT_RULES.forEach((rule) => {
      const match = rule.regex.exec(text)
      if (match) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          rule,
        })
      }
    })

    // Sort by start index
    matches.sort((a, b) => a.start - b.start)

    // Filter overlapping
    const cleanMatches = []
    let lastEnd = 0
    for (const m of matches) {
      if (m.start >= lastEnd) {
        cleanMatches.push(m)
        lastEnd = m.end
      }
    }

    if (!cleanMatches.length) {
      return <span>{text}</span>
    }

    const elements = []
    let cursor = 0

    cleanMatches.forEach((m, idx) => {
      // Text before match
      if (m.start > cursor) {
        elements.push(text.slice(cursor, m.start))
      }

      const isSelected = selectedHighlight?.tag === m.rule.tag

      // Highlighted span
      elements.push(
        <mark
          key={idx}
          className={`vp-phrase-highlight ${isSelected ? 'selected' : ''}`}
          style={{
            backgroundColor: m.rule.bgColor,
            color: 'var(--text-primary)',
            borderColor: m.rule.borderColor,
            boxShadow: isSelected ? `0 0 12px ${m.rule.borderColor}` : 'none',
          }}
          onClick={() => setSelectedHighlight(m.rule)}
          tabIndex={0}
          role="button"
          aria-label={`Evidence snippet: ${m.text} (${m.rule.tag})`}
        >
          {m.text}
          <span
            className="vp-phrase-tag"
            style={{
              backgroundColor: m.rule.borderColor,
              color: '#FFFFFF',
            }}
          >
            {m.rule.tag}
          </span>
        </mark>
      )

      cursor = m.end
    })

    if (cursor < text.length) {
      elements.push(text.slice(cursor))
    }

    return elements
  }, [text, selectedHighlight])

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
            VoicePath automatically spotted key work evidence. Tap any highlighted phrase to inspect the detected skill.
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
            {isEditing ? '👁️ View Highlights' : '✏️ Edit Text'}
          </button>
        </div>
      </div>

      {/* Main Review Card */}
      <div className="vp-review-container glass-card">
        {/* Discovered tags quick bar */}
        <div className="vp-evidence-tags-row" role="region" aria-label="Detected evidence categories">
          <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Detected Evidence:
          </span>
          {detectedTags.map((t) => {
            const isSel = selectedHighlight?.tag === t.tag
            return (
              <button
                key={t.tag}
                className={`vp-evidence-pill ${isSel ? 'selected' : ''}`}
                style={{
                  borderColor: t.borderColor,
                  backgroundColor: isSel ? t.bgColor : 'rgba(17, 24, 39, 0.6)',
                  color: isSel ? '#FFFFFF' : t.color,
                }}
                onClick={() => setSelectedHighlight(t)}
                type="button"
              >
                <span className="vp-evidence-pill-dot" style={{ backgroundColor: t.color }} />
                {t.tag}
              </button>
            )
          })}
        </div>

        {/* Text Container: Either Interactive Highlight View or Editable Textarea */}
        <div className="vp-transcript-viewer">
          {isEditing ? (
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
          ) : (
            <div className="vp-highlighted-display" aria-label="Highlighted transcript with detected skills">
              <blockquote className="vp-highlighted-quote">
                &ldquo;{renderedHighlightedText}&rdquo;
              </blockquote>
            </div>
          )}
        </div>

        {/* Interactive Evidence Inspector Card */}
        {selectedHighlight && !isEditing && (
          <div
            className="vp-evidence-inspector-card"
            style={{ borderLeftColor: selectedHighlight.color }}
            role="region"
            aria-label="Skill evidence details"
          >
            <div className="vp-inspector-header">
              <div className="vp-inspector-title-row">
                <span
                  className="vp-badge"
                  style={{
                    backgroundColor: selectedHighlight.bgColor,
                    color: selectedHighlight.color,
                    borderColor: selectedHighlight.borderColor,
                    borderWidth: 1,
                    borderStyle: 'solid',
                  }}
                >
                  {selectedHighlight.tag}
                </span>
                <strong className="vp-inspector-skill-name text-primary">
                  {selectedHighlight.skill}
                </strong>
              </div>
              <span className="text-secondary font-mono" style={{ fontSize: '0.75rem' }}>
                Extracted Evidence
              </span>
            </div>

            <p className="vp-inspector-explanation">
              {selectedHighlight.explanation}
            </p>
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
