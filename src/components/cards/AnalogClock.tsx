interface AnalogClockProps {
  hours: number    // 0–23
  minutes: number  // 0–59
  size?: number
  className?: string
}

/**
 * Minimal SVG analog clock face.
 * Renders hour + minute hands only — no seconds, no numbers.
 * Color inherits via currentColor so it respects the card's text-text-primary class.
 */
export function AnalogClock({ hours, minutes, size = 56, className }: AnalogClockProps) {
  const cx = size / 2
  const cy = size / 2
  const r  = size / 2 - 1.5          // outer circle radius

  // Angles in degrees, 0° = 12 o'clock, clockwise
  const hourDeg = (hours % 12) * 30 + minutes * 0.5
  const minDeg  = minutes * 6

  const hourLen = r * 0.52            // hour hand length
  const minLen  = r * 0.76            // minute hand length

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      className={className}
    >
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} strokeWidth={1} opacity={0.35} />

      {/* 12 tick marks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180
        const inner = r * 0.88
        const outer = r * 0.97
        return (
          <line
            key={i}
            x1={cx + inner * Math.sin(angle)}
            y1={cy - inner * Math.cos(angle)}
            x2={cx + outer * Math.sin(angle)}
            y2={cy - outer * Math.cos(angle)}
            strokeWidth={i === 0 ? 1.5 : 0.8}
            opacity={0.4}
          />
        )
      })}

      {/* Hour hand */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + hourLen * Math.sin((hourDeg * Math.PI) / 180)}
        y2={cy - hourLen * Math.cos((hourDeg * Math.PI) / 180)}
        strokeWidth={2}
      />

      {/* Minute hand */}
      <line
        x1={cx}
        y1={cy}
        x2={cx + minLen * Math.sin((minDeg * Math.PI) / 180)}
        y2={cy - minLen * Math.cos((minDeg * Math.PI) / 180)}
        strokeWidth={1.25}
      />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={1.5} fill="currentColor" stroke="none" />
    </svg>
  )
}
