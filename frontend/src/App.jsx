import { useState, useCallback } from 'react'
import MobileNav from './components/MobileNav.jsx'

import './index.css'
import './App.css'
import './components/components.css'

import Header                 from './components/Header.jsx'
import VoiceRecorder          from './components/VoiceRecorder.jsx'
import TranscriptReview        from './components/TranscriptReview.jsx'
import AIProcessingTransition  from './components/AIProcessingTransition.jsx'
import SkillDiscovery         from './components/SkillDiscovery.jsx'
import SkillProfile           from './components/SkillProfile.jsx'
import OpportunitiesView      from './components/OpportunitiesView.jsx'

import { analyzeVoice } from './services/api.js'

// ── Stage constants ────────────────────────────────────────────────────────────
const STAGE = {
  INTAKE:        'intake',
  REVIEWING:     'reviewing',
  DISCOVERING:   'discovering',
  PROFILE:       'profile',
  OPPORTUNITIES: 'opportunities',
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="vp-footer" role="contentinfo">
      <span className="vp-footer__brand">
        Voice<span className="vp-footer__accent">Path</span>
      </span>
      <span>Team Code Red · Edutech Track · 2026</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Built with ❤️ &amp; React
      </span>
    </footer>
  )
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Core state machine ────────────────────────────────────
  const [stage,          setStage]          = useState(STAGE.INTAKE)
  const [language,       setLanguage]       = useState('en-IN')
  const [transcript,     setTranscript]     = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isLoading,      setIsLoading]      = useState(false)
  const [apiError,       setApiError]       = useState('')
  const [simpleView,     setSimpleView]     = useState(false)

  // ── Stage 1 → 2: Voice recorded, move to transcript review ─
  const handleTranscriptReady = useCallback((text, lang) => {
    setTranscript(text)
    setLanguage(lang)
    setApiError('')
    setStage(STAGE.REVIEWING)
  }, [])

  // ── Stage 2 → 3: User confirms transcript, run analysis ───
  const handleConfirm = useCallback(async (editedTranscript) => {
    setIsLoading(true)
    setApiError('')

    const minAnimationDelay = new Promise((res) => setTimeout(res, 1800))

    try {
      const [response] = await Promise.all([
        analyzeVoice({ transcript: editedTranscript }),
        minAnimationDelay,
      ])

      if (!response.success) throw new Error(response.message ?? 'Analysis failed')
      setAnalysisResult(response.data)
      setStage(STAGE.DISCOVERING)
    } catch (err) {
      setApiError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Stage 3 → 4: User is done reviewing skills ────────────
  const handleContinueToProfile = useCallback(() => {
    setStage(STAGE.PROFILE)
  }, [])

  // ── Any stage → Stage 1: Full reset ───────────────────────
  const handleStartOver = useCallback(() => {
    setStage(STAGE.INTAKE)
    setTranscript('')
    setAnalysisResult(null)
    setApiError('')
    setIsLoading(false)
  }, [])

  // ── Stage 2: Re-record (back to intake without clearing lang) ─
  const handleReRecord = useCallback(() => {
    setStage(STAGE.INTAKE)
    setTranscript('')
    setApiError('')
  }, [])

  // ── Stage 4 → 5: Move to Career Opportunities & Upskilling ─
  const handleFindJobs = useCallback(() => {
    setStage(STAGE.OPPORTUNITIES)
  }, [])

  // ── Render current stage ───────────────────────────────────
  function renderStage() {
    if (isLoading) {
      return <AIProcessingTransition />
    }

    switch (stage) {
      case STAGE.INTAKE:
        return (
          <VoiceRecorder
            language={language}
            onTranscriptReady={handleTranscriptReady}
          />
        )

      case STAGE.REVIEWING:
        return (
          <TranscriptReview
            transcript={transcript}
            language={language}
            onConfirm={handleConfirm}
            onReRecord={handleReRecord}
            isLoading={isLoading}
          />
        )

      case STAGE.DISCOVERING:
        return (
          <SkillDiscovery
            analysisResult={analysisResult}
            onContinue={handleContinueToProfile}
            onStartOver={handleStartOver}
          />
        )

      case STAGE.PROFILE:
        return (
          <SkillProfile
            analysisResult={analysisResult}
            onStartOver={handleStartOver}
            onFindJobs={handleFindJobs}
          />
        )

      case STAGE.OPPORTUNITIES:
        return (
          <OpportunitiesView
            onBackToProfile={() => setStage(STAGE.PROFILE)}
            onStartOver={handleStartOver}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="vp-app">
      {/* Sticky header with live status, step indicator, a11y & avatar */}
      <Header
        stage={stage}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Main content area */}
      <main
        id="main-content"
        className="vp-page"
        aria-label={`Stage: ${stage}`}
      >
        {/* Global API error banner */}
        {apiError && !isLoading && (
          <div
            className="vp-alert vp-alert--error"
            role="alert"
            style={{ marginBottom: 'var(--space-6)', maxWidth: 720, margin: '0 auto var(--space-6)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
              <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
              <line x1="9" y1="5" x2="9" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="9" cy="12.5" r="0.8" fill="currentColor" />
            </svg>
            <div>
              <strong>Error:</strong> {apiError}
              <button
                className="vp-btn vp-btn--ghost vp-btn--sm"
                onClick={() => setApiError('')}
                style={{ marginLeft: 'var(--space-3)' }}
                type="button"
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {renderStage()}
      </main>

      <Footer />

      {/* Mobile bottom navigation — visible < 768px */}
      <MobileNav
        stage={stage}
        onNavigate={(s) => setStage(s)}
        onStartOver={handleStartOver}
        simpleView={simpleView}
        onToggleSimpleView={() => setSimpleView((v) => !v)}
      />
    </div>
  )
}
