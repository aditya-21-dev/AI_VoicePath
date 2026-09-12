import { useState, useMemo, useEffect } from 'react'
import OpportunityCard from './OpportunityCard.jsx'
import MatchBreakdown from './MatchBreakdown.jsx'
import SkillGap from './SkillGap.jsx'
import LearningPath from './LearningPath.jsx'
import WhatIfSimulator from './WhatIfSimulator.jsx'
import OpportunityMap from './OpportunityMap.jsx'
import SkillAnalytics from './SkillAnalytics.jsx'
import Toast from './Toast.jsx'
import { matchOpportunities } from '../services/api.js'

import {
  TEXTILE_WORKER_SKILL_GAP,
  TEXTILE_WORKER_LEARNING_PATH,
  TEXTILE_WORKER_SKILLS,
  DEFAULT_USER_LOCATION,
} from '../data/mockData.js'

/**
 * OpportunitiesView — Master career matching & upskilling intelligence hub.
 * Dynamically connects user speech-extracted skills to verified backend opportunities.
 *
 * @param {{
 *   analysisResult?: object,
 *   initialTab?: 'matches'|'analytics'|'gap'|'path'|'whatif',
 *   onBackToProfile?: () => void,
 *   onStartOver?: () => void
 * }} props
 */
export default function OpportunitiesView({
  analysisResult,
  initialTab = 'matches',
  onBackToProfile,
  onStartOver,
}) {
  const [activeTab, setActiveTab]                 = useState(initialTab)
  const [selectedDistrict, setSelectedDistrict]   = useState('all')
  const [selectedOppForExplain, setSelectedOppForExplain] = useState(null)
  const [selectedOppId, setSelectedOppId]         = useState(null)
  const [toastMessage, setToastMessage]           = useState('')
  const [toastType, setToastType]                 = useState('success')
  const [opportunities, setOpportunities]         = useState([])
  const [isLoading, setIsLoading]                 = useState(true)
  const [loadError, setLoadError]                 = useState('')

  function triggerToast(msg, type = 'success') {
    setToastMessage(msg)
    setToastType(type)
    setTimeout(() => {
      setToastMessage('')
    }, 3500)
  }

  // Extract real canonical skills from the spoken analysis result
  const userSkills = useMemo(() => {
    const rawSkills = analysisResult?.profile?.skills ?? []
    return rawSkills
      .map((s) => (typeof s === 'string' ? s : s?.canonical_name))
      .filter(Boolean)
  }, [analysisResult])

  const skillsSummary = useMemo(() => {
    return userSkills.length > 0 ? userSkills.join(', ') : 'your spoken competencies'
  }, [userSkills])

  // Fetch opportunities from the real matching backend
  useEffect(() => {
    let cancelled = false

    const expYears = Number(analysisResult?.profile?.experience_years) || 1
    const domain = Array.isArray(analysisResult?.profile?.domain)
      ? analysisResult.profile.domain[0]
      : analysisResult?.profile?.domain

    matchOpportunities({
      skills: userSkills,
      experience_years: expYears,
      district: selectedDistrict === 'all' ? null : selectedDistrict,
      domain: domain === 'all' ? null : domain,
    })
      .then((data) => {
        if (!cancelled) {
          setOpportunities(Array.isArray(data) ? data : [])
          setLoadError('')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load matched opportunities:', err)
          setLoadError(err.message || 'Could not load matching opportunities.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [userSkills, selectedDistrict, analysisResult])

  // Opportunities to display
  const filteredOpps = useMemo(() => {
    if (selectedDistrict === 'all') {
      return opportunities.slice(0, 10)
    }
    return opportunities.filter((o) =>
      (o.district || '').toLowerCase().includes(selectedDistrict.toLowerCase()) ||
      (o.location || '').toLowerCase().includes(selectedDistrict.toLowerCase())
    ).slice(0, 10)
  }, [opportunities, selectedDistrict])

  function handleExplain(opp) {
    setSelectedOppForExplain(opp)
  }

  function handleViewGap() {
    setActiveTab('gap')
    triggerToast('Loaded Skill Gap diagnostic for target benchmark.', 'info')
  }

  function handleStartLearning() {
    setActiveTab('path')
    triggerToast('Personalized 4-Phase Learning Pathway generated!', 'success')
  }

  return (
    <div className="vp-opportunities-hub vp-fade-in">
      {/* Toast Notification Container */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Screen Header */}
      <div className="vp-opp-hub-header">
        <div>
          <span className="vp-badge vp-badge--accent" style={{ marginBottom: 'var(--space-2)' }}>
            <span className="vp-stage-step__num" style={{ width: 14, height: 14, fontSize: '0.65rem', marginRight: 4 }}>4</span>
            Career Intelligence &amp; Upskilling
          </span>
          <h1 className="vp-page-title__h1">
            Verified Opportunities &amp; Pathways
          </h1>
          <p className="vp-page-title__sub">
            Matched specifically against your spoken competencies: <strong style={{ color: 'var(--text-primary)' }}>{skillsSummary}</strong>.
          </p>
        </div>

        {/* Tab Navigation Hub */}
        <div className="vp-hub-tabs-row" role="tablist" aria-label="Career intelligence sections">
          <button
            className={`vp-hub-tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
            role="tab"
            aria-selected={activeTab === 'matches'}
            type="button"
          >
            <span>🎯 Verified Roles &amp; Map</span>
            <span className="vp-badge vp-badge--cyan" style={{ fontSize: '0.65rem', marginLeft: 6 }}>
              {filteredOpps.length} Matches
            </span>
          </button>

          <button
            className={`vp-hub-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
            role="tab"
            aria-selected={activeTab === 'analytics'}
            type="button"
          >
            <span>📊 Analytics</span>
            <span className="vp-badge vp-badge--accent" style={{ fontSize: '0.65rem', marginLeft: 6 }}>
              Recharts
            </span>
          </button>

          <button
            className={`vp-hub-tab-btn ${activeTab === 'gap' ? 'active' : ''}`}
            onClick={() => setActiveTab('gap')}
            role="tab"
            aria-selected={activeTab === 'gap'}
            type="button"
          >
            <span>⚡ Skill Gap</span>
          </button>

          <button
            className={`vp-hub-tab-btn ${activeTab === 'path' ? 'active' : ''}`}
            onClick={() => setActiveTab('path')}
            role="tab"
            aria-selected={activeTab === 'path'}
            type="button"
          >
            <span>🗺️ Learning Path</span>
          </button>

          <button
            className={`vp-hub-tab-btn ${activeTab === 'whatif' ? 'active' : ''}`}
            onClick={() => setActiveTab('whatif')}
            role="tab"
            aria-selected={activeTab === 'whatif'}
            type="button"
          >
            <span>📈 What-If Simulator</span>
            <span className="vp-badge vp-badge--accent" style={{ fontSize: '0.65rem', marginLeft: 6 }}>
              AI Model
            </span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: Matched Opportunities + Interactive Map ──── */}
      {activeTab === 'matches' && (
        <section className="vp-matches-section" aria-label="Matched Career Opportunities">
          {/* District Filter Bar */}
          <div className="vp-district-filter-bar glass-card">
            <span className="text-secondary font-semibold" style={{ fontSize: '0.82rem' }}>
              Filter by District Cluster:
            </span>
            <div className="vp-district-chips">
              <button
                className={`vp-district-chip ${selectedDistrict === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDistrict('all')
                  triggerToast('Showing verified roles across all districts')
                }}
                type="button"
              >
                All Clusters
              </button>
              <button
                className={`vp-district-chip ${selectedDistrict === 'chennai' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDistrict('chennai')
                  triggerToast('Filtered to Chennai / Tiruvallur industrial corridor')
                }}
                type="button"
              >
                Chennai / Tiruvallur
              </button>
              <button
                className={`vp-district-chip ${selectedDistrict === 'tirupur' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDistrict('tirupur')
                  triggerToast('Filtered to Tirupur / Coimbatore cluster')
                }}
                type="button"
              >
                Tirupur / Coimbatore
              </button>
              <button
                className={`vp-district-chip ${selectedDistrict === 'bangalore' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedDistrict('bangalore')
                  triggerToast('Filtered to Bangalore Tech Hub')
                }}
                type="button"
              >
                Bangalore
              </button>
            </div>
          </div>

          {loadError && (
            <div className="vp-alert vp-alert--error" style={{ marginBottom: 'var(--space-4)' }}>
              <span>{loadError}</span>
            </div>
          )}

          {/* Desktop: Split Cards | Map; Mobile: Cards ↓ Map */}
          <div className="vp-opps-and-map-layout">
            <div className="vp-opps-column">
              {isLoading ? (
                <div className="glass-card" style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <p>Analyzing speech evidence and matching verified opportunities...</p>
                </div>
              ) : filteredOpps.length > 0 ? (
                <div className="vp-opps-grid" role="feed" aria-label="Matching role listings">
                  {filteredOpps.map((opp) => (
                    <div
                      key={opp.id}
                      className={`vp-opp-card-wrapper ${selectedOppId === opp.id ? 'active-selection' : ''}`}
                      onClick={() => setSelectedOppId(opp.id)}
                    >
                      <OpportunityCard
                        opportunity={opp}
                        onExplain={handleExplain}
                        onViewGap={handleViewGap}
                        onBookmark={(title) => triggerToast(`Saved role: "${title}" to your profile!`, 'success')}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* Robust Empty State */
                <div className="vp-empty-state glass-card">
                  <span className="vp-empty-icon">🔍</span>
                  <h3 className="vp-empty-title text-primary">No opportunities found in this district</h3>
                  <p className="vp-empty-desc text-secondary">
                    No active roles match your speech profile in the selected cluster right now. Try expanding your search.
                  </p>
                  <button
                    className="vp-btn vp-btn--secondary vp-btn--sm"
                    onClick={() => setSelectedDistrict('all')}
                    type="button"
                  >
                    Reset to All Districts
                  </button>
                </div>
              )}
            </div>

            {/* Map Column */}
            <div className="vp-opps-map-column">
              <OpportunityMap
                opportunities={filteredOpps}
                userLocation={DEFAULT_USER_LOCATION}
                selectedOppId={selectedOppId}
                onSelectOpportunity={(opp) => {
                  setSelectedOppId(opp.id)
                  triggerToast(`Selected ${opp.company} (${opp.district})`, 'info')
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* ─── TAB 2: Visual Analytics (Recharts) ───────────────── */}
      {activeTab === 'analytics' && (
        <section className="vp-analytics-section" aria-label="Competency Analytics">
          <SkillAnalytics
            skills={userSkills.length > 0 ? userSkills.map((s) => ({ canonical_name: s, proficiency: 'Demonstrated' })) : TEXTILE_WORKER_SKILLS}
            breakdown={filteredOpps[0]?.breakdown}
            gapData={TEXTILE_WORKER_SKILL_GAP}
          />
        </section>
      )}

      {/* ─── TAB 3: Skill Gap Diagnostics ───────────────────── */}
      {activeTab === 'gap' && (
        <SkillGap
          gapData={TEXTILE_WORKER_SKILL_GAP}
          onStartLearning={handleStartLearning}
        />
      )}

      {/* ─── TAB 4: Learning Pathway ────────────────────────── */}
      {activeTab === 'path' && (
        <LearningPath
          pathData={TEXTILE_WORKER_LEARNING_PATH}
          onBookmarkResource={(title) => triggerToast(`Bookmarked resource: "${title}"`, 'info')}
        />
      )}

      {/* ─── TAB 5: What-If Simulation Engine ───────────────── */}
      {activeTab === 'whatif' && (
        <WhatIfSimulator
          baseReadiness={74}
          onSkillToggled={(name) => triggerToast(`Simulated acquiring "${name}" — match recalculated!`, 'info')}
        />
      )}

      {/* Explainability Breakdown Modal */}
      {selectedOppForExplain && (
        <MatchBreakdown
          opportunity={selectedOppForExplain}
          onClose={() => setSelectedOppForExplain(null)}
          onViewGap={handleViewGap}
        />
      )}

      {/* Footer Navigation CTA */}
      <div className="vp-hub-footer-nav">
        <button
          className="vp-btn vp-btn--ghost vp-btn--lg"
          onClick={onBackToProfile}
          type="button"
        >
          ← Back to Verified Profile
        </button>

        <button
          className="vp-btn vp-btn--ghost"
          onClick={onStartOver}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8a5 5 0 1 1 1.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <polyline points="1,5 3,8 6,6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Start Over
        </button>
      </div>
    </div>
  )
}
