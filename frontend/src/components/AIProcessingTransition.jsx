import { useState, useEffect } from 'react'

const PIPELINE_STEPS = [
  {
    id: 'step_1',
    label: 'Acoustic Processing & Transcription',
    detail: 'Cleaning audio frequencies and normalizing regional dialect patterns.',
    icon: '🎙️',
  },
  {
    id: 'step_2',
    label: 'Understanding Vocational Context',
    detail: 'Mapping 4 years of retail floor experience and day-to-day work tasks.',
    icon: '🧵',
  },
  {
    id: 'step_3',
    label: 'Identifying Transferable & Implicit Skills',
    detail: 'Uncovering unstated abilities in inventory control, machinery, and service.',
    icon: '⚡',
  },
  {
    id: 'step_4',
    label: 'Calibrating Confidence & Opportunity Matches',
    detail: 'Synthesizing canonical NSQF-aligned competencies and career readiness.',
    icon: '✨',
  },
]

/**
 * AIProcessingTransition — Cinematic multi-stage progression screen.
 * Shows smooth transitions between processing milestones while NLP pipeline runs.
 *
 * @param {{
 *   onComplete?: () => void
 * }} props
 */
export default function AIProcessingTransition() {
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [progressPct, setProgressPct]       = useState(18)

  useEffect(() => {
    // Stage 1 -> Stage 2
    const t1 = setTimeout(() => {
      setCurrentStepIdx(1)
      setProgressPct(44)
    }, 450)

    // Stage 2 -> Stage 3
    const t2 = setTimeout(() => {
      setCurrentStepIdx(2)
      setProgressPct(76)
    }, 950)

    // Stage 3 -> Stage 4
    const t3 = setTimeout(() => {
      setCurrentStepIdx(3)
      setProgressPct(96)
    }, 1450)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  return (
    <div className="vp-processing-screen" role="status" aria-live="polite">
      {/* Central Holographic Core */}
      <div className="vp-hologram-core-wrapper">
        <div className="vp-hologram-ring outer" />
        <div className="vp-hologram-ring middle" />
        <div className="vp-hologram-ring inner" />

        <div className="vp-hologram-center">
          <div className="vp-hologram-orb glow-violet" />
          <span className="vp-hologram-step-icon">
            {PIPELINE_STEPS[currentStepIdx].icon}
          </span>
        </div>
      </div>

      {/* Progress counter */}
      <div className="vp-processing-counter">
        <span className="vp-processing-pct font-mono">{progressPct}%</span>
        <span className="vp-processing-label text-secondary">Neural Skill Synthesis</span>
      </div>

      {/* Pipeline Milestones Checklist */}
      <div className="vp-pipeline-milestones glass-card">
        {PIPELINE_STEPS.map((step, idx) => {
          const isDone    = idx < currentStepIdx
          const isCurrent = idx === currentStepIdx
          return (
            <div
              key={step.id}
              className={`vp-milestone-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
            >
              <div className="vp-milestone-marker">
                {isDone ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <circle cx="8" cy="8" r="8" fill="#10B981" />
                    <path d="M4.5 8l2.5 2.5 4.5-5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : isCurrent ? (
                  <div className="vp-milestone-spinner" />
                ) : (
                  <span className="vp-milestone-dot" />
                )}
              </div>

              <div className="vp-milestone-text">
                <p className="vp-milestone-title">{step.label}</p>
                <p className="vp-milestone-detail">{step.detail}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Encouraging microcopy */}
      <p className="vp-processing-microcopy">
        Converting your everyday spoken words into recognized industry credentials.
      </p>
    </div>
  )
}
