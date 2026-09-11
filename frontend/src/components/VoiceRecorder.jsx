import { useState, useRef, useEffect, useCallback } from 'react'
import VoiceOrb from './VoiceOrb.jsx'
import { DEMO_TEXTILE_TRANSCRIPT, TECH_PROFILE } from '../data/mockData.js'

// Checks for browser SpeechRecognition support
function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return (
    window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    null
  )
}

/**
 * VoiceRecorder — Primary cinematic voice intake interface.
 *
 * Features:
 *   - VoiceOrb circular voice interface with live timer & reactive waveform
 *   - High-fidelity states: idle → recording → processing
 *   - Prominent 1-click Demo Mode showcasing the Textile Worker Persona
 *   - Multilingual transcription and live speech-to-text fallback
 *
 * @param {{
 *   language: string,
 *   onTranscriptReady: (transcript: string, lang: string) => void
 * }} props
 */
export default function VoiceRecorder({ language = 'en-IN', onTranscriptReady }) {
  const [recState, setRecState]             = useState('idle') // idle | recording | processing
  const [interim, setInterim]               = useState('')
  const [finalText, setFinalText]           = useState('')
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [hasSpeechSupport]                  = useState(() => !!getSpeechRecognition())
  const [errorMsg, setErrorMsg]             = useState('')

  const recognitionRef = useRef(null)
  const finalTextRef   = useRef('')
  const timerRef       = useRef(null)

  // Keep ref in sync with state
  useEffect(() => {
    finalTextRef.current = finalText
  }, [finalText])

  // Timer tick during recording
  useEffect(() => {
    if (recState !== 'recording') return

    timerRef.current = setInterval(() => {
      setDurationSeconds((s) => s + 1)
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [recState])

  // ── Stop recording helper ──────────────────────────────────
  const stopRecordingSession = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Safe ignore
      }
      recognitionRef.current = null
    }
  }, [])

  // ── Finalize transcript and hand off ───────────────────────
  const handleStop = useCallback(() => {
    stopRecordingSession()
    const text = (finalTextRef.current || interim).trim()

    if (!text) {
      setErrorMsg('No speech was detected. Please try speaking again or click Demo Mode below.')
      setRecState('idle')
      return
    }

    setRecState('processing')
    setTimeout(() => {
      onTranscriptReady(text, language)
    }, 600)
  }, [interim, language, onTranscriptReady, stopRecordingSession])

  // ── Start recording ────────────────────────────────────────
  const startRecording = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) {
      setErrorMsg('Speech recognition is not supported in this browser. Please use Demo Mode.')
      return
    }

    setErrorMsg('')
    setInterim('')
    setFinalText('')
    finalTextRef.current = ''
    setDurationSeconds(0)

    const recognition = new SpeechRecognition()
    recognition.lang            = language
    recognition.continuous      = true
    recognition.interimResults  = true
    recognition.maxAlternatives = 1

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
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setErrorMsg(`Microphone note: ${e.error}. You can still use the 1-click Demo Mode.`)
      }
      stopRecordingSession()
    }

    recognition.onend = () => {
      // If we finished while recording, resolve
      if (finalTextRef.current.trim()) {
        handleStop()
      } else {
        setRecState('idle')
      }
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
      setRecState('recording')
    } catch {
      setErrorMsg('Could not start microphone. Try clicking Demo Mode below.')
      setRecState('idle')
    }
  }, [language, handleStop, stopRecordingSession])

  // ── Trigger Demo Mode (Canonical Textile Persona) ──────────
  const handleDemoMode = useCallback((customPhrase) => {
    setErrorMsg('')
    setRecState('processing')
    const phrase = customPhrase || DEMO_TEXTILE_TRANSCRIPT
    setFinalText(phrase)
    finalTextRef.current = phrase

    setTimeout(() => {
      onTranscriptReady(phrase, language)
    }, 600)
  }, [language, onTranscriptReady])

  // ── Reset ──────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    stopRecordingSession()
    setRecState('idle')
    setInterim('')
    setFinalText('')
    finalTextRef.current = ''
    setDurationSeconds(0)
    setErrorMsg('')
  }, [stopRecordingSession])

  const isRecording  = recState === 'recording'
  const isProcessing = recState === 'processing'

  return (
    <div className="vp-recorder">
      {/* Title & guidance */}
      <div className="vp-recorder__hero">
        <span className="vp-badge vp-badge--accent" style={{ marginBottom: 'var(--space-2)' }}>
          <span className="vp-stage-step__num" style={{ width: 14, height: 14, fontSize: '0.65rem', marginRight: 4 }}>1</span>
          Speech-to-Skills Intake
        </span>
        <h1 className="vp-recorder__title">Speak naturally about what you do</h1>
        <p className="vp-recorder__subtitle">
          Describe your day-to-day job, tools, and tasks in your own words. Our AI extracts your full skill profile automatically.
        </p>
      </div>

      {/* Error / info alert */}
      {errorMsg && (
        <div className="vp-alert vp-alert--error" role="alert" style={{ width: '100%', maxWidth: 480 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
            <line x1="9" y1="5" x2="9" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="9" cy="12.5" r="0.8" fill="currentColor" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live transcript stream preview while recording */}
      {isRecording && (
        <div className="vp-recorder__live-stream" aria-live="polite">
          <p className="vp-recorder__stream-text">
            {finalText || interim || <span className="vp-pulse-text">Listening to your speech…</span>}
          </p>
        </div>
      )}

      {/* Center Cinematic Voice Orb */}
      <div className="vp-recorder__orb-wrapper">
        <VoiceOrb
          state={recState}
          durationSeconds={durationSeconds}
          onClick={isRecording ? handleStop : startRecording}
          hasSpeechSupport={hasSpeechSupport}
        />

        {/* Status prompt */}
        <div className="vp-recorder__status-banner">
          <p className={`vp-recorder__status ${isRecording ? 'listening' : ''}`}>
            {isRecording
              ? 'Click the orb to stop & analyze'
              : isProcessing
              ? 'Synthesizing speech input…'
              : hasSpeechSupport
              ? 'Click the orb to begin speaking'
              : 'Voice API unavailable on this browser — use Demo below'}
          </p>

          {isRecording && (
            <button
              className="vp-btn vp-btn--ghost vp-btn--sm"
              onClick={handleRetry}
              type="button"
              aria-label="Restart recording"
              style={{ marginTop: 'var(--space-2)' }}
            >
              Cancel &amp; Restart
            </button>
          )}
        </div>
      </div>

      {/* Prominent Demo Mode Showcase Card */}
      {!isProcessing && (
        <div className="vp-demo-showcase-card glass-card">
          <div className="vp-demo-showcase__header">
            <div className="vp-demo-showcase__badge">
              <span className="vp-sparkle-dot" />
              1-Click Demo Mode
            </div>
            <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
              No microphone setup required
            </span>
          </div>

          <p className="vp-demo-showcase__desc">
            Experience VoicePath through our canonical Edutech profile:
          </p>

          <blockquote className="vp-demo-showcase__quote">
            &ldquo;{DEMO_TEXTILE_TRANSCRIPT}&rdquo;
          </blockquote>

          <div className="vp-demo-showcase__actions">
            <button
              id="vp-demo-btn"
              className="vp-btn vp-btn--primary vp-btn--lg glow-violet"
              onClick={() => handleDemoMode(DEMO_TEXTILE_TRANSCRIPT)}
              type="button"
              disabled={isProcessing}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <polygon points="4,2 14,8 4,14" fill="currentColor" />
              </svg>
              <span>Try Textile Worker Demo</span>
              <span className="vp-badge vp-badge--cyan" style={{ marginLeft: 'var(--space-2)', fontSize: '0.65rem' }}>
                Priya Sharma · 4 yrs
              </span>
            </button>

            {/* Alternate tech persona quick test */}
            <button
              className="vp-btn vp-btn--secondary vp-btn--sm"
              onClick={() => handleDemoMode(TECH_PROFILE.transcript)}
              type="button"
              title="Test with Data Analyst persona"
            >
              📊 Test Data Professional Demo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
