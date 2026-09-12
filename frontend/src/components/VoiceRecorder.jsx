import { useState, useRef, useEffect, useCallback } from 'react'
import VoiceOrb from './VoiceOrb.jsx'
import { transcribeAudio } from '../services/api.js'

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
export default function VoiceRecorder({ language = 'en', onTranscriptReady }) {
  const [recState, setRecState]             = useState('idle') // idle | recording | processing
  const [audioBlob, setAudioBlob]           = useState(null)
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [hasRecordingSupport]               = useState(() => {
    return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'
  })
  const [errorMsg, setErrorMsg]             = useState('')

  const mediaRecorderRef = useRef(null)
  const streamRef        = useRef(null)
  const chunksRef        = useRef([])
  const timerRef       = useRef(null)

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

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const sendToBackend = useCallback(async (blob) => {
    setRecState('processing')
    setErrorMsg('')

    try {
      const result = await transcribeAudio({ audio: blob, language })
      onTranscriptReady(result, result.language || language)
    } catch (error) {
      setErrorMsg(error.message ?? 'Transcription failed. Please retry.')
      setRecState('idle')
    }
  }, [language, onTranscriptReady])

  // ── Start recording ────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!hasRecordingSupport) {
      setErrorMsg('Audio recording is not available in this browser.')
      return
    }

    setErrorMsg('')
    setAudioBlob(null)
    setDurationSeconds(0)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        stopStream()

        if (blob.size === 0) {
          setErrorMsg('No audio was captured. Please record again.')
          setRecState('idle')
          return
        }

        setAudioBlob(blob)
        sendToBackend(blob)
      }

      recorder.onerror = () => {
        setErrorMsg('Recording failed. Please retry.')
        setRecState('idle')
        stopStream()
      }

      recorder.start()
      setRecState('recording')
    } catch (error) {
      setErrorMsg(error.message ?? 'Could not start microphone. Please check browser permission and retry.')
      setRecState('idle')
      stopStream()
    }
  }, [hasRecordingSupport, sendToBackend, stopStream])

  const handleStop = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  // ── Reset ──────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    stopStream()
    setRecState('idle')
    setAudioBlob(null)
    chunksRef.current = []
    setDurationSeconds(0)
    setErrorMsg('')
  }, [stopStream])

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
            <span className="vp-pulse-text">Listening to your speech…</span>
          </p>
        </div>
      )}

      {/* Center Cinematic Voice Orb */}
      <div className="vp-recorder__orb-wrapper">
        <VoiceOrb
          state={recState}
          durationSeconds={durationSeconds}
          onClick={isRecording ? handleStop : startRecording}
          hasSpeechSupport={hasRecordingSupport}
        />

        {/* Status prompt & CTA Row */}
        <div className="vp-recorder__status-banner">
          <p className={`vp-recorder__status ${isRecording ? 'listening' : ''}`}>
            {isRecording
              ? 'Listening to your speech… Click to stop & analyze'
              : isProcessing
              ? 'Sending audio to VoicePath backend…'
              : hasRecordingSupport
              ? 'Click to start speaking about your work experience'
              : 'Audio recording is unavailable in this browser'}
          </p>

          {/* Primary CTA: "Start Speaking" / "Stop & Analyze" & Secondary "Demo Mode" */}
          <div className="vp-recorder__cta-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
            <button
              id="vp-start-speaking-btn"
              className={`vp-btn vp-btn--primary vp-btn--lg ${isRecording ? 'vp-btn--recording' : 'glow-violet'}`}
              onClick={isRecording ? handleStop : startRecording}
              type="button"
              disabled={isProcessing || (!hasRecordingSupport && !isRecording)}
            >
              {isRecording ? (
                <>
                  <span className="vp-orb-stop-square" style={{ width: 12, height: 12, display: 'inline-block', background: '#fff', borderRadius: 2 }} />
                  <span>Stop &amp; Analyze</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 11a7 7 0 0 0 14 0" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                  </svg>
                  <span>Start Speaking</span>
                </>
              )}
            </button>

            {isRecording && (
              <button
                className="vp-btn vp-btn--ghost vp-btn--sm"
                onClick={handleRetry}
                type="button"
                aria-label="Restart recording"
              >
                Cancel &amp; Restart
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Backend integration status card */}
      {!isProcessing && (
        <div className="vp-demo-showcase-card glass-card">
          <div className="vp-demo-showcase__header">
            <div className="vp-demo-showcase__badge">
              <span className="vp-sparkle-dot" />
              Backend Voice Intake
            </div>
            <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
              {audioBlob ? 'Audio captured' : 'Ready for recording'}
            </span>
          </div>

          <p className="vp-demo-showcase__desc">
            VoicePath sends your recorded audio and selected language to Member 2&apos;s backend.
          </p>

          <blockquote className="vp-demo-showcase__quote">
            POST /api/v1/transcribe · multipart audio + language
          </blockquote>

          <div className="vp-demo-showcase__actions">
            <button
              id="vp-demo-btn"
              className="vp-btn vp-btn--primary vp-btn--lg glow-violet"
              onClick={audioBlob ? () => sendToBackend(audioBlob) : startRecording}
              type="button"
              disabled={isProcessing || (!audioBlob && !hasRecordingSupport)}
            >
              <span>{audioBlob ? 'Retry Transcription' : 'Start Backend Recording'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
