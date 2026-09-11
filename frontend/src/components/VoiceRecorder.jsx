import { useState, useRef, useEffect, useCallback } from 'react'

const DEMO_PHRASE =
  'I have worked in a shop for four years. I manage stock and handle customers.'

const BARS = Array.from({ length: 11 })

// Checks for browser SpeechRecognition support
function getSpeechRecognition() {
  return (
    window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    null
  )
}

/**
 * MicIcon — filled microphone SVG
 */
function MicIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
      <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="9"  y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function StopIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
  )
}

/**
 * VoiceRecorder — primary intake screen.
 *
 * States: idle → recording → processing → (emits transcript)
 * Also supports Demo Mode which skips real recording.
 *
 * @param {{
 *   language: string,
 *   onTranscriptReady: (transcript: string, lang: string) => void
 * }} props
 */
export default function VoiceRecorder({ language = 'en-IN', onTranscriptReady }) {
  const [recState, setRecState]       = useState('idle')       // idle | recording | processing
  const [interim, setInterim]         = useState('')
  const [finalText, setFinalText]     = useState('')
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true)
  const [errorMsg, setErrorMsg]       = useState('')

  const recognitionRef = useRef(null)
  const finalTextRef   = useRef('')    // ref so closure in recognition event always sees latest

  // Check speech recognition availability on mount
  useEffect(() => {
    setHasSpeechSupport(!!getSpeechRecognition())
  }, [])

  // Keep ref in sync with state
  useEffect(() => {
    finalTextRef.current = finalText
  }, [finalText])

  // ── Start real recording via Web Speech API ──────────────
  const startRecording = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) return

    setErrorMsg('')
    setInterim('')
    setFinalText('')
    finalTextRef.current = ''

    const recognition = new SpeechRecognition()
    recognition.lang              = language
    recognition.continuous        = true
    recognition.interimResults    = true
    recognition.maxAlternatives   = 1

    recognition.onresult = (e) => {
      let interim_ = ''
      let final_   = finalTextRef.current

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          final_ += (final_ ? ' ' : '') + t.trim()
        } else {
          interim_ += t
        }
      }

      finalTextRef.current = final_
      setFinalText(final_)
      setInterim(interim_)
    }

    recognition.onerror = (e) => {
      // 'no-speech' and 'aborted' are benign
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setErrorMsg(`Microphone error: ${e.error}. Try Demo Mode below.`)
      }
      stopRecording()
    }

    recognition.onend = () => {
      // If we ended while still in recording state, finalize
      if (recState === 'recording') {
        handleStop()
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
      setRecState('recording')
    } catch {
      setErrorMsg('Could not start the microphone. Try Demo Mode.')
    }
  }, [language]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop and hand off transcript ─────────────────────────
  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
  }, [])

  const handleStop = useCallback(() => {
    stopRecording()
    const text = finalTextRef.current.trim() || interim.trim()
    if (!text) {
      setErrorMsg('No speech detected. Please try again or use Demo Mode.')
      setRecState('idle')
      return
    }
    setRecState('processing')
    // Brief processing animation before handing off
    setTimeout(() => {
      onTranscriptReady(text, language)
    }, 800)
  }, [interim, language, onTranscriptReady, stopRecording])

  // ── Demo Mode ─────────────────────────────────────────────
  const handleDemoMode = useCallback(() => {
    stopRecording()
    setRecState('processing')
    setInterim(DEMO_PHRASE)
    setTimeout(() => {
      onTranscriptReady(DEMO_PHRASE, 'en-IN')
    }, 1200)
  }, [onTranscriptReady, stopRecording])

  // ── Retry ─────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    stopRecording()
    setRecState('idle')
    setInterim('')
    setFinalText('')
    setErrorMsg('')
  }, [stopRecording])

  const isRecording  = recState === 'recording'
  const isProcessing = recState === 'processing'
  const isIdle       = recState === 'idle'

  return (
    <div className="vp-recorder">
      {/* Hero copy */}
      <div className="vp-recorder__hero">
        <div className="vp-page-title__eyebrow">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
            <line x1="7" y1="4" x2="7" y2="7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="7" cy="10" r="0.8" fill="currentColor" />
          </svg>
          Step 1 of 4
        </div>
        <h1 className="vp-recorder__title">Tell us about yourself</h1>
        <p className="vp-recorder__subtitle">
          Speak naturally about your work experience. We&rsquo;ll pick out your skills automatically.
        </p>
      </div>

      {/* Browser support warning */}
      {!hasSpeechSupport && (
        <div className="vp-no-speech-warning" role="alert">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M9 1L1 16h16L9 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <line x1="9" y1="7" x2="9" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="9" cy="13.5" r="0.75" fill="currentColor" />
          </svg>
          <span>
            Your browser doesn&rsquo;t support voice input. Use <strong>Demo Mode</strong> to explore the app.
          </span>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="vp-alert vp-alert--error" role="alert">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="9" y1="5" x2="9" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="9" cy="12.5" r="0.8" fill="currentColor" />
          </svg>
          {errorMsg}
        </div>
      )}

      {/* Waveform (only visible while recording or processing) */}
      {(isRecording || isProcessing) && (
        <div className="vp-waveform" aria-hidden="true">
          {BARS.map((_, i) => (
            <div
              key={i}
              className={`vp-waveform__bar${isRecording ? ' live' : ''}`}
              style={
                isProcessing
                  ? { height: `${6 + Math.sin(i * 0.8) * 10}px`, opacity: 0.5 }
                  : {}
              }
            />
          ))}
        </div>
      )}

      {/* Interim / final transcript preview while listening */}
      {isRecording && (
        <p
          className="vp-recorder__interim"
          aria-live="polite"
          aria-atomic="false"
        >
          {finalText || interim || <em style={{ color: 'var(--text-muted)' }}>Listening…</em>}
        </p>
      )}

      {isProcessing && (
        <p className="vp-recorder__status" aria-live="polite">
          Analysing your speech…
        </p>
      )}

      {/* Main controls */}
      <div className="vp-recorder__actions">
        <div className="vp-recorder__btn-row">
          {/* Mic / Stop button */}
          {hasSpeechSupport && !isProcessing && (
            <button
              id="vp-mic-btn"
              className={`vp-mic-btn${isRecording ? ' recording' : ''}`}
              onClick={isRecording ? handleStop : startRecording}
              aria-label={isRecording ? 'Stop recording' : 'Start speaking'}
              type="button"
            >
              {isRecording ? <StopIcon /> : <MicIcon />}
            </button>
          )}

          {/* Processing spinner */}
          {isProcessing && <div className="vp-spinner" aria-label="Processing" role="status" />}

          {/* Retry button shown after recording started */}
          {(isRecording || isProcessing) && !isIdle && (
            <button
              className="vp-btn vp-btn--ghost vp-btn--sm"
              onClick={handleRetry}
              type="button"
              aria-label="Start over"
            >
              Retry
            </button>
          )}
        </div>

        {/* Status label */}
        {!isProcessing && (
          <p className={`vp-recorder__status${isRecording ? ' listening' : ''}`} aria-live="polite">
            {isRecording
              ? '🔴 Listening — speak now'
              : hasSpeechSupport
              ? 'Press the mic to begin'
              : 'Use Demo Mode to continue'}
          </p>
        )}
      </div>

      {/* Demo Mode divider */}
      {!isProcessing && (
        <>
          <div className="vp-recorder__divider">or</div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              id="vp-demo-btn"
              className="vp-btn vp-btn--secondary"
              onClick={handleDemoMode}
              type="button"
              disabled={isProcessing}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <polygon points="4,2 14,8 4,14" fill="currentColor" />
              </svg>
              Try Demo Mode
            </button>

            <p className="vp-recorder__hint">
              Demo uses the phrase:
              <span className="vp-recorder__demo-phrase">
                &ldquo;{DEMO_PHRASE}&rdquo;
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  )
}
