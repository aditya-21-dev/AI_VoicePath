import { useCallback, useState } from 'react'
import MobileNav from './components/MobileNav.jsx'

import './index.css'
import './App.css'
import './components/components.css'

import Header from './components/Header.jsx'
import VoiceRecorder from './components/VoiceRecorder.jsx'
import TranscriptReview from './components/TranscriptReview.jsx'
import AIProcessingTransition from './components/AIProcessingTransition.jsx'
import SkillDiscovery from './components/SkillDiscovery.jsx'
import SkillProfile from './components/SkillProfile.jsx'
import OpportunitiesView from './components/OpportunitiesView.jsx'

import { extractProfileFromTranscript } from './services/api.js'

const STAGE = {
  INTAKE: 'intake',
  REVIEWING: 'reviewing',
  DISCOVERING: 'discovering',
  PROFILE: 'profile',
  OPPORTUNITIES: 'opportunities',
}

function normalizeProfileResponse(response, transcript, language, asrConfidence) {
  const profile = response?.profile ?? response
  const skills = profile?.skills ?? response?.skills ?? []

  return {
    transcript,
    detected_language: response?.language ?? language,
    asr_confidence: asrConfidence,
    profile: {
      name: profile?.name ?? 'VoicePath Candidate',
      domain: profile?.domain ?? 'Work Experience',
      seniority: profile?.seniority ?? 'Profile extracted from speech',
      experience_years: profile?.experience_years ?? 0,
      summary: profile?.summary ?? 'Structured profile generated from the reviewed transcript.',
      roles: profile?.roles ?? [],
      responsibilities: profile?.responsibilities ?? [],
      skills,
    },
  }
}

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

export default function App() {
  const [stage, setStage] = useState(STAGE.INTAKE)
  const [language, setLanguage] = useState('ta')
  const [transcript, setTranscript] = useState('')
  const [transcriptMeta, setTranscriptMeta] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [simpleView, setSimpleView] = useState(false)

  const handleTranscriptReady = useCallback((result, selectedLang) => {
    const text = typeof result === 'string' ? result : result?.transcript
    const returnedLanguage = typeof result === 'string' ? selectedLang : result?.language

    setTranscript(text ?? '')
    setTranscriptMeta(typeof result === 'string' ? null : result)
    setLanguage(returnedLanguage || selectedLang)
    setApiError('')
    setStage(STAGE.REVIEWING)
  }, [])

  const handleConfirm = useCallback(
    async (editedTranscript) => {
      setIsLoading(true)
      setApiError('')
      setTranscript(editedTranscript)

      const minAnimationDelay = new Promise((resolve) => setTimeout(resolve, 1200))

      try {
        const [profileResponse] = await Promise.all([
          extractProfileFromTranscript({
            transcript: editedTranscript,
            language,
          }),
          minAnimationDelay,
        ])

        setAnalysisResult(
          normalizeProfileResponse(
            profileResponse,
            editedTranscript,
            transcriptMeta?.language ?? language,
            transcriptMeta?.confidence,
          ),
        )
        setStage(STAGE.DISCOVERING)
      } catch (err) {
        setApiError(err.message ?? 'Profile extraction failed. Please try again.')
      } finally {
        setIsLoading(false)
      }
    },
    [language, transcriptMeta],
  )

  const handleRetry = useCallback(() => {
    if (stage === STAGE.REVIEWING && transcript.trim()) {
      handleConfirm(transcript)
      return
    }

    setApiError('')
    setStage(STAGE.INTAKE)
  }, [handleConfirm, stage, transcript])

  const handleContinueToProfile = useCallback(() => {
    setStage(STAGE.PROFILE)
  }, [])

  const handleStartOver = useCallback(() => {
    setStage(STAGE.INTAKE)
    setTranscript('')
    setTranscriptMeta(null)
    setAnalysisResult(null)
    setApiError('')
    setIsLoading(false)
  }, [])

  const handleReRecord = useCallback(() => {
    setStage(STAGE.INTAKE)
    setTranscript('')
    setTranscriptMeta(null)
    setApiError('')
  }, [])

  const handleFindJobs = useCallback(() => {
    setStage(STAGE.OPPORTUNITIES)
  }, [])

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
            language={transcriptMeta?.language ?? language}
            asrConfidence={transcriptMeta?.confidence}
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
      <Header
        stage={stage}
        language={language}
        onLanguageChange={setLanguage}
      />

      <main
        id="main-content"
        className="vp-page"
        aria-label={`Stage: ${stage}`}
      >
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
                onClick={handleRetry}
                style={{ marginLeft: 'var(--space-3)' }}
                type="button"
                aria-label="Retry failed action"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {renderStage()}
      </main>

      <Footer />

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
