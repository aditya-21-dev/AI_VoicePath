import { useState, useMemo } from 'react'

const SIMULATION_SKILLS = [
  {
    id: 'aql_25',
    name: 'AQL 2.5 Sampling Inspection',
    category: 'Quality Assurance',
    boostPct: 18,
    unlockedRole: 'Apparel Quality Assurance (QA) Supervisor',
    desc: 'International ISO standard for acceptable quality limits on export garments.',
  },
  {
    id: 'defect_tax',
    name: 'Garment Defect Classification',
    category: 'Inspection & Stitching',
    boostPct: 8,
    unlockedRole: 'Senior Floor QA Auditor',
    desc: 'Formal taxonomy of sewing defects (skip stitch, puckering) and fabric faults.',
  },
  {
    id: 'cad_pattern',
    name: 'CAD Pattern Grading & Tech Packs',
    category: 'Sample Room & Design',
    boostPct: 14,
    unlockedRole: 'Sample Room Lead / Pattern Technician',
    desc: 'Reading garment spec sheets, seam allowances, and digital CAD grading.',
  },
  {
    id: 'digital_qc',
    name: 'Digital Quality Audit Tools (Tablet ERP)',
    category: 'Industry 4.0 / Digital',
    boostPct: 10,
    unlockedRole: 'Digital QC Specialist',
    desc: 'Real-time production floor tablet auditing replacing manual paper logs.',
  },
  {
    id: 'lean_5s',
    name: '5S Lean Manufacturing & Floor 5S',
    category: 'Operations Leadership',
    boostPct: 6,
    unlockedRole: 'Line Balancing Coordinator',
    desc: 'Systematic visual workplace organization and bottleneck elimination.',
  },
]

/**
 * WhatIfSimulator — Interactive career & readiness simulation engine.
 * Allows candidates and evaluators to model before/after match boosts (e.g., 74% -> 92%).
 *
 * @param {{
 *   baseReadiness?: number,
 *   onSkillToggled?: (skillName: string) => void
 * }} props
 */
export default function WhatIfSimulator({
  baseReadiness = 74,
  onSkillToggled,
}) {
  // Initial selected skills for demo impact
  const [selectedSkillIds, setSelectedSkillIds] = useState(['aql_25', 'defect_tax'])

  function handleToggle(id) {
    setSelectedSkillIds((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
      const toggled = SIMULATION_SKILLS.find((s) => s.id === id)
      if (toggled) onSkillToggled?.(toggled.name)
      return next
    })
  }

  // Calculate dynamic projected readiness
  const totalBoost = useMemo(() => {
    return selectedSkillIds.reduce((sum, id) => {
      const skill = SIMULATION_SKILLS.find((s) => s.id === id)
      return sum + (skill ? skill.boostPct : 0)
    }, 0)
  }, [selectedSkillIds])

  const projectedScore = Math.min(98, baseReadiness + totalBoost)

  // Unlocked roles based on selected skills
  const unlockedRoles = useMemo(() => {
    return SIMULATION_SKILLS
      .filter((s) => selectedSkillIds.includes(s.id))
      .map((s) => s.unlockedRole)
  }, [selectedSkillIds])

  // Estimated salary increase
  const salaryBoostText = totalBoost >= 26
    ? '+INR 1.8L - 2.5L / yr (+45% - 55% wage jump)'
    : totalBoost >= 18
    ? '+INR 1.2L - 1.8L / yr (+30% - 40% wage jump)'
    : totalBoost > 0
    ? '+INR 60k - 1.0L / yr (+15% - 25% wage jump)'
    : 'Select competencies below to calculate impact'

  return (
    <div className="vp-what-if-view vp-fade-in">
      {/* Interactive Before / After Comparison Meter */}
      <div className="vp-whatif-hero glass-card">
        <div className="vp-whatif-header-text">
          <span className="vp-badge vp-badge--accent" style={{ fontSize: '0.72rem', marginBottom: 4 }}>
            Predictive Upskilling Engine
          </span>
          <h2 className="vp-whatif-title text-primary">
            What-If Career Readiness Simulator
          </h2>
          <p className="vp-whatif-subtitle text-secondary">
            Toggle future skills to preview how your match score, verified roles, and compensation jump.
          </p>
        </div>

        {/* Dynamic Comparison Meter */}
        <div className="vp-whatif-meter-card">
          <div className="vp-whatif-score-comparison">
            {/* Before Score */}
            <div className="vp-whatif-score-pill before">
              <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>CURRENT READINESS</span>
              <span className="vp-whatif-score-digits font-mono">{baseReadiness}%</span>
            </div>

            {/* Arrow & Delta Boost */}
            <div className="vp-whatif-delta-center">
              <div className="vp-whatif-delta-badge font-mono glow-violet">
                +{totalBoost}% Boost
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" stroke="var(--accent-hover)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Projected Score */}
            <div className="vp-whatif-score-pill after">
              <span className="text-accent-cyan" style={{ fontSize: '0.75rem', fontWeight: 600 }}>PROJECTED READINESS</span>
              <span className="vp-whatif-score-digits font-mono projected text-success">
                {projectedScore}%
              </span>
            </div>
          </div>

          {/* Dual Bar Track */}
          <div className="vp-whatif-dual-track" aria-label={`Readiness increases from ${baseReadiness}% to ${projectedScore}%`}>
            {/* Base segment */}
            <div className="vp-whatif-dual-fill base" style={{ width: `${baseReadiness}%` }} />
            {/* Boost segment */}
            <div
              className="vp-whatif-dual-fill boost"
              style={{
                left: `${baseReadiness}%`,
                width: `${projectedScore - baseReadiness}%`,
              }}
            />
          </div>
        </div>

        {/* Projected Salary Banner */}
        <div className="vp-whatif-salary-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.4rem' }}>📈</span>
            <div>
              <strong className="text-primary font-semibold" style={{ fontSize: '0.92rem', display: 'block' }}>
                Projected Market Compensation Jump:
              </strong>
              <span className="text-success font-mono font-bold" style={{ fontSize: '0.95rem' }}>
                {salaryBoostText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Competency Checkboxes */}
      <div className="vp-whatif-skills-section glass-card">
        <h3 className="vp-whatif-section-title text-primary">
          Select Hypothetical Competencies to Acquire:
        </h3>
        <p className="vp-whatif-section-sub text-secondary">
          Click any skill to toggle it into the simulator and see real-time impact.
        </p>

        <div className="vp-whatif-grid" role="group" aria-label="Hypothetical skills">
          {SIMULATION_SKILLS.map((skill) => {
            const isChecked = selectedSkillIds.includes(skill.id)
            return (
              <div
                key={skill.id}
                className={`vp-whatif-card ${isChecked ? 'active glow-violet' : ''}`}
                onClick={() => handleToggle(skill.id)}
                tabIndex={0}
                role="checkbox"
                aria-checked={isChecked}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    handleToggle(skill.id)
                  }
                }}
              >
                <div className="vp-whatif-card-header">
                  <div className="vp-whatif-checkbox">
                    {isChecked ? '✓' : ''}
                  </div>
                  <div>
                    <strong className="vp-whatif-skill-name text-primary">
                      {skill.name}
                    </strong>
                    <span className="text-muted font-mono" style={{ fontSize: '0.72rem', display: 'block' }}>
                      {skill.category}
                    </span>
                  </div>
                </div>

                <p className="vp-whatif-card-desc text-secondary">
                  {skill.desc}
                </p>

                <div className="vp-whatif-card-footer">
                  <span className="vp-badge vp-badge--cyan font-mono" style={{ fontSize: '0.72rem' }}>
                    +{skill.boostPct}% Match Boost
                  </span>
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Unlocks promotion
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Newly Unlocked Roles List */}
      {unlockedRoles.length > 0 && (
        <div className="vp-unlocked-roles-card glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>🔓</span>
            <h3 className="text-primary font-bold" style={{ fontSize: '1.05rem' }}>
              Roles Unlocked by Simulation ({unlockedRoles.length}):
            </h3>
          </div>

          <div className="vp-unlocked-pills-row">
            {unlockedRoles.map((role) => (
              <span key={role} className="vp-badge vp-badge--accent" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                ★ {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Clean Prototype Disclaimer */}
      <div className="vp-whatif-disclaimer-box">
        <p className="text-muted" style={{ fontSize: '0.78rem', textAlign: 'center', lineHeight: 1.5 }}>
          ⚠️ <strong>Prototype Simulation Disclaimer:</strong> Match projections and salary ranges are calculated using VoicePath&apos;s experimental Edutech predictive market algorithm. Values are illustrative for hackathon demonstration.
        </p>
      </div>
    </div>
  )
}
