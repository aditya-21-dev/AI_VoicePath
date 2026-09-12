import { useState } from 'react'

/**
 * SkillMap — Interactive Constellation & Node Network Visualization.
 * Visualizes detected skills as interconnected nodes around vocational domain hubs.
 *
 * @param {{
 *   skills: Array<import('../data/mockData').MOCK_SKILLS[0]>,
 *   profileName?: string
 * }} props
 */
export default function SkillMap({ skills = [], profileName = 'Priya Sharma' }) {
  const [activeNodeId, setActiveNodeId] = useState(null)

  // Map skills to fixed balanced coordinates around 3 domain clusters
  const domainClusters = [
    { id: 'dom_craft', label: 'Machinery & Craft', x: 230, y: 140, color: '#06B6D4' },
    { id: 'dom_ops',   label: 'Inventory & Store', x: 570, y: 140, color: '#F59E0B' },
    { id: 'dom_client',label: 'Service & Quality',  x: 400, y: 380, color: '#10B981' },
  ]

  // Coordinates for skill nodes
  const skillNodes = [
    // Craft cluster (top-left)
    { id: 'sk_0', name: 'Industrial Sewing', x: 120, y: 90,  clusterId: 'dom_craft', skillIdx: 0 },
    { id: 'sk_4', name: 'Garment Alterations', x: 140, y: 220, clusterId: 'dom_craft', skillIdx: 4 },

    // Ops cluster (top-right)
    { id: 'sk_1', name: 'Stock Management',  x: 680, y: 90,  clusterId: 'dom_ops', skillIdx: 1 },
    { id: 'sk_5', name: 'POS & Billing',      x: 700, y: 210, clusterId: 'dom_ops', skillIdx: 5 },
    { id: 'sk_6', name: 'Vendor Logistics',   x: 580, y: 60,  clusterId: 'dom_ops', skillIdx: 6 },

    // Client/Quality cluster (bottom)
    { id: 'sk_2', name: 'Customer Service',   x: 280, y: 410, clusterId: 'dom_client', skillIdx: 2 },
    { id: 'sk_3', name: 'Quality Inspection', x: 520, y: 410, clusterId: 'dom_client', skillIdx: 3 },
    { id: 'sk_7', name: 'Floor Supervision',  x: 400, y: 450, clusterId: 'dom_client', skillIdx: 7 },
  ]

  // Find active skill object for detail panel
  const activeSkill = activeNodeId !== null
    ? skills.find((_, idx) => `sk_${idx}` === activeNodeId) || skills[0]
    : null

  return (
    <div className="vp-skill-map-container glass-card">
      <div className="vp-skill-map__header">
        <div>
          <h2 className="vp-skill-map__title">Neural Competency Constellation</h2>
          <p className="vp-skill-map__subtitle text-secondary">
            Hover or tap any skill node to view connections and contextual evidence.
          </p>
        </div>

        {/* Legend */}
        <div className="vp-skill-map__legend">
          <span className="vp-legend-item font-mono" style={{ color: '#06B6D4' }}>
            <span className="vp-legend-dot" style={{ background: '#06B6D4' }} /> Machinery
          </span>
          <span className="vp-legend-item font-mono" style={{ color: '#F59E0B' }}>
            <span className="vp-legend-dot" style={{ background: '#F59E0B' }} /> Inventory
          </span>
          <span className="vp-legend-item font-mono" style={{ color: '#10B981' }}>
            <span className="vp-legend-dot" style={{ background: '#10B981' }} /> Service
          </span>
        </div>
      </div>

      <div className="vp-skill-map__canvas-wrapper">
        <svg
          viewBox="0 0 800 480"
          className="vp-skill-map__svg"
          aria-label="Interactive skill graph"
        >
          <defs>
            {/* Center glow gradient */}
            <radialGradient id="center-core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#6366F1" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#07090D" stopOpacity="0" />
            </radialGradient>

            {/* Line glow filter */}
            <filter id="glow-line" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Lines from Center to Domain Clusters */}
          {domainClusters.map((dom) => (
            <line
              key={`line-core-${dom.id}`}
              x1="400"
              y1="240"
              x2={dom.x}
              y2={dom.y}
              stroke="rgba(139, 92, 246, 0.4)"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />
          ))}

          {/* Lines from Domain Clusters to Skill Nodes */}
          {skillNodes.map((node) => {
            const dom = domainClusters.find((d) => d.id === node.clusterId)
            const isHighlight = activeNodeId === node.id || activeNodeId === dom.id
            return (
              <line
                key={`line-${node.id}`}
                x1={dom.x}
                y1={dom.y}
                x2={node.x}
                y2={node.y}
                stroke={isHighlight ? dom.color : 'rgba(255, 255, 255, 0.12)'}
                strokeWidth={isHighlight ? 2.5 : 1.5}
                filter={isHighlight ? 'url(#glow-line)' : undefined}
                className="vp-map-edge"
              />
            )
          })}

          {/* Center Hub: User Core */}
          <g transform="translate(400, 240)">
            <circle r="60" fill="url(#center-core-glow)" />
            <circle
              r="34"
              fill="#0B0F17"
              stroke="#8B5CF6"
              strokeWidth="2.5"
              filter="url(#glow-line)"
              className="vp-map-core-circle"
            />
            <text
              textAnchor="middle"
              dy="-4"
              fill="#FFFFFF"
              fontSize="12"
              fontWeight="700"
              fontFamily="var(--font-sans)"
            >
              {profileName.split(' ')[0]}
            </text>
            <text
              textAnchor="middle"
              dy="12"
              fill="#A78BFA"
              fontSize="9.5"
              fontWeight="600"
              fontFamily="var(--font-mono)"
            >
              Core Profile
            </text>
          </g>

          {/* Domain Cluster Nodes */}
          {domainClusters.map((dom) => (
            <g
              key={dom.id}
              transform={`translate(${dom.x}, ${dom.y})`}
              className="vp-map-domain-group"
              onClick={() => setActiveNodeId(dom.id)}
            >
              <circle
                r="22"
                fill="rgba(11, 15, 23, 0.9)"
                stroke={dom.color}
                strokeWidth="2"
                strokeDasharray="2 2"
              />
              <circle r="6" fill={dom.color} />
              <text
                textAnchor="middle"
                dy="34"
                fill={dom.color}
                fontSize="11"
                fontWeight="600"
                fontFamily="var(--font-sans)"
              >
                {dom.label}
              </text>
            </g>
          ))}

          {/* Leaf Skill Nodes */}
          {skillNodes.map((node) => {
            const skillObj = skills[node.skillIdx]
            const isSelected = activeNodeId === node.id
            const dom = domainClusters.find((d) => d.id === node.clusterId)
            const pct = skillObj ? Math.round(skillObj.confidence * 100) : 85

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className={`vp-map-skill-node ${isSelected ? 'active' : ''}`}
                onClick={() => setActiveNodeId(node.id)}
                tabIndex={0}
                role="button"
                aria-label={`${node.name}, ${pct}% match`}
              >
                <circle
                  r={isSelected ? 26 : 20}
                  fill="#0B0F17"
                  stroke={isSelected ? '#FFFFFF' : dom.color}
                  strokeWidth={isSelected ? 3 : 2}
                  className="vp-node-circle"
                />
                <text
                  textAnchor="middle"
                  dy="4"
                  fill="#F8FAFC"
                  fontSize={isSelected ? "10.5" : "9"}
                  fontWeight="700"
                  fontFamily="var(--font-mono)"
                >
                  {pct}%
                </text>
                <text
                  textAnchor="middle"
                  dy={isSelected ? 38 : 32}
                  fill="#CBD5E1"
                  fontSize="11"
                  fontWeight="500"
                  fontFamily="var(--font-sans)"
                  className="vp-node-label"
                >
                  {node.name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Node Detail Drawer / Floating Card */}
      {activeSkill && (
        <div className="vp-map-detail-card vp-fade-in" role="region" aria-label="Selected skill details">
          <div className="vp-map-detail-header">
            <div className="vp-map-detail-title-row">
              <span className="vp-badge vp-badge--accent" style={{ fontSize: '0.7rem' }}>
                {activeSkill.inference_type}
              </span>
              <h4 className="vp-map-detail-title text-primary">
                {activeSkill.canonical_name}
              </h4>
            </div>
            <span className="vp-confidence-badge font-mono">
              {Math.round(activeSkill.confidence * 100)}% Confidence
            </span>
          </div>

          <p className="vp-map-detail-phrase">
            Spoken Evidence: &ldquo;{activeSkill.raw_phrase}&rdquo;
          </p>
          <p className="vp-map-detail-evidence text-secondary">
            {activeSkill.evidence}
          </p>
        </div>
      )}
    </div>
  )
}
