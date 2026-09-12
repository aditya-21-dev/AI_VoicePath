import { useState, useEffect } from 'react'

/**
 * VoiceOrb — Cinematic animated circular voice interface.
 * Features:
 *   - 5 High-Fidelity States: Idle | Listening (Recording) | Processing | Completed | Error
 *   - Concentric pulsing gradient rings (Electric Violet #8B5CF6 to Cyan #06B6D4)
 *   - Simulated audio frequency reaction during recording
 *   - Live duration timer (mm:ss)
 *   - Ambient inner glow and status cues
 *
 * @param {{
 *   state: 'idle'|'recording'|'listening'|'processing'|'completed'|'error',
 *   durationSeconds?: number,
 *   onClick: () => void,
 *   hasSpeechSupport?: boolean
 * }} props
 */
export default function VoiceOrb({
  state = 'idle',
  durationSeconds = 0,
  onClick,
  hasSpeechSupport = true,
}) {
  const isListening  = state === 'recording' || state === 'listening'
  const isProcessing = state === 'processing'
  const isCompleted  = state === 'completed'
  const isError      = state === 'error'

  // Simulated live audio reactivity bars for waveform around the orb
  const [frequencies, setFrequencies] = useState([12, 24, 38, 50, 65, 45, 55, 70, 35, 20, 14])

  useEffect(() => {
    if (!isListening) return

    const interval = setInterval(() => {
      setFrequencies(
        Array.from({ length: 11 }, () => Math.floor(Math.random() * 55) + 15)
      )
    }, 110)

    return () => {
      clearInterval(interval)
      setFrequencies([10, 16, 22, 28, 30, 28, 22, 16, 10, 8, 6])
    }
  }, [isListening])

  // Format mm:ss
  const mins = String(Math.floor(durationSeconds / 60)).padStart(2, '0')
  const secs = String(durationSeconds % 60).padStart(2, '0')

  return (
    <div className={`vp-voice-orb-container state-${state} ${isListening ? 'listening' : ''}`}>
      {/* Outer ambient glow rings */}
      <div className={`vp-orb-pulse-ring ring-1 ${isListening ? 'active' : ''}`} />
      <div className={`vp-orb-pulse-ring ring-2 ${isListening ? 'active' : ''}`} />
      <div className={`vp-orb-pulse-ring ring-3 ${isListening ? 'active' : ''}`} />

      {/* Main interactive sphere */}
      <button
        id="vp-voice-orb-btn"
        className={`vp-voice-orb state-${state}`}
        onClick={onClick}
        type="button"
        disabled={isProcessing || (!hasSpeechSupport && !isListening)}
        aria-label={
          isListening
            ? `Listening in progress, ${mins}:${secs}. Click to finish speaking.`
            : isProcessing
            ? 'Analyzing speech audio...'
            : isCompleted
            ? 'Speech captured successfully'
            : isError
            ? 'Speech error, click to retry'
            : 'Click microphone to begin speaking'
        }
      >
        {/* Animated holographic gradient overlay */}
        <div className="vp-orb-core-glow" />

        {/* Center icon / status */}
        <div className="vp-orb-content">
          {isProcessing ? (
            <div className="vp-orb-spinner" aria-hidden="true" />
          ) : isListening ? (
            <div className="vp-orb-recording-icon" aria-hidden="true">
              <span className="vp-orb-stop-square" />
            </div>
          ) : isCompleted ? (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : isError ? (
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg
              className="vp-orb-mic-icon"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
              <path
                d="M5 11a7 7 0 0 0 14 0"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
              <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="9"  y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          )}
        </div>

        {/* Orbiting particle ring */}
        <div className="vp-orb-orbit-particle" />
      </button>

      {/* Waveform visualizer docked below orb */}
      <div className="vp-orb-waveform-row" aria-hidden="true">
        {frequencies.map((h, i) => (
          <span
            key={i}
            className={`vp-orb-wave-bar ${isListening ? 'active' : ''}`}
            style={{
              height: `${isListening ? h : 8}px`,
              opacity: isListening ? 0.35 + (h / 70) * 0.65 : 0.25,
            }}
          />
        ))}
      </div>

      {/* Live recording timer */}
      {isListening && (
        <div className="vp-orb-timer-pill" aria-live="polite">
          <span className="vp-orb-recording-dot" />
          <span className="vp-orb-timer-digits font-mono">{mins}:{secs}</span>
        </div>
      )}
    </div>
  )
}
