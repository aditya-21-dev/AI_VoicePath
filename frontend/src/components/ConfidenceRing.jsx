/**
 * ConfidenceRing — Reusable SVG radial confidence arc meter.
 *
 * Renders a circular progress ring with a multi-stop gradient stroke
 * (Violet → Indigo → Cyan) animated from 0 to the target percentage.
 *
 * Features:
 *   - Smooth animated stroke-dashoffset entry
 *   - Custom gradient stroke using SVG linearGradient
 *   - Configurable size, stroke width, and colours
 *   - Central percentage label in mono font
 *   - Accessible ARIA value attributes
 *
 * @param {{
 *   pct: number,
 *   size?: number,
 *   strokeWidth?: number,
 *   gradientColors?: [string, string, string],
 *   label?: string,
 *   className?: string,
 * }} props
 */
export default function ConfidenceRing({
  pct,
  size = 52,
  strokeWidth = 3.5,
  gradientColors = ['#8B5CF6', '#6366F1', '#06B6D4'],
  label,
  className = '',
}) {
  const viewBox = 48
  const center = viewBox / 2
  const radius = (viewBox - strokeWidth * 2) / 2 - 1
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(pct, 100) / 100) * circumference

  // Unique gradient ID per instance to avoid SVG id collisions
  const gradId = `vp-cring-${pct}-${size}`

  return (
    <div
      className={`vp-confidence-ring-wrapper ${className}`}
      style={{ width: size, height: size }}
      role="meter"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${pct}% confidence`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        className="vp-confidence-ring"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={gradientColors[0]} />
            <stop offset="55%"  stopColor={gradientColors[1]} />
            <stop offset="100%" stopColor={gradientColors[2]} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.07)"
          strokeWidth={strokeWidth}
        />

        {/* Animated fill ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />

        {/* Optional glow shadow circle behind the fill */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth + 2}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          opacity={0.15}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: 'blur(3px)',
          }}
        />
      </svg>

      {/* Centre label */}
      <span className="vp-confidence-ring-value font-mono">{pct}%</span>
    </div>
  )
}
