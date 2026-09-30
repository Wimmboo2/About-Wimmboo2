import { useId } from 'react'
import { moonPhaseName } from '../lib/dates.js'

// Lit part of the moon disc for phase p (0 new → 0.5 full → 1 new), radius r at (0,0).
function litPath(p, r) {
  const waxing = p < 0.5
  const t = Math.cos(2 * Math.PI * p) // 1 = new, -1 = full
  const rx = Math.abs(t) * r
  const crescent = t > 0
  if (waxing) {
    // right limb, then terminator back up
    return `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${rx} ${r} 0 0 ${crescent ? 0 : 1} 0 ${-r} Z`
  }
  // left limb, then terminator back up
  return `M0 ${-r} A${r} ${r} 0 0 0 0 ${r} A${rx} ${r} 0 0 ${crescent ? 1 : 0} 0 ${-r} Z`
}

// Real moon phase: a disc masked by the lit shape.
export default function Moon({ phase, selected = false, size = 30 }) {
  const id = useId().replace(/:/g, '')
  const r = 10
  const name = moonPhaseName(phase)
  const lit = Math.round(((1 - Math.cos(2 * Math.PI * phase)) / 2) * 100)
  return (
    <svg
      className={`moon ${selected ? 'moon--selected' : ''}`}
      width={size}
      height={size}
      viewBox="-12 -12 24 24"
      role="img"
      aria-label={`Moon phase: ${name}, ${lit}% lit`}
    >
      <mask id={`m${id}`}>
        <rect x="-12" y="-12" width="24" height="24" fill="black" />
        <path d={litPath(phase, r)} fill="white" />
      </mask>
      <circle className="moon__disc" r={r} />
      <circle className="moon__lit" r={r} mask={`url(#m${id})`} />
      <circle className="moon__rim" r={r} />
    </svg>
  )
}
