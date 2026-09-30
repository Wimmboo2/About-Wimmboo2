import { memo } from 'react'

/* The water is built from the pause-menu video itself: the body is a
   seamless texture cut from the video's water (public/images/water-texture.jpg),
   the surface waves use the exact colors sampled from it, plus a few bubbles.
   Only transforms animate (compositor-friendly). */

// tiny seeded RNG so the art is identical on every load
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const f = (n) => n.toFixed(1)

/* ---- surface waves: periodic, 4.. wavelengths in 2400 units → seamless -50% loop ---- */
function wavePaths({ width = 2400, height = 160, base, amp, waves = 4, step = 15 }) {
  const k = (Math.PI * 2 * waves) / width
  const y = (x) => f(base - amp * (Math.sin(x * k) - 0.25 * Math.cos(2 * x * k)))
  let line = `M0 ${y(0)}`
  for (let x = step; x <= width; x += step) line += ` L${x} ${y(x)}`
  return [`${line} L${width} ${height} L0 ${height} Z`, line]
}

const WAVES = [
  { cls: 'back', paths: wavePaths({ base: 60, amp: 30, waves: 6 }) },
  { cls: 'mid', paths: wavePaths({ base: 92, amp: 22, waves: 4 }) },
  { cls: 'front', paths: wavePaths({ base: 122, amp: 16, waves: 8 }) },
]

/* ---- bubbles: [size px, left %, rise s, delay s, sway px] ---- */
const BUBBLES = (() => {
  const r = rng(99)
  const out = []
  // clusters, like the video
  const clusters = [9, 31, 58, 83]
  clusters.forEach((cx) => {
    const n = 3 + Math.floor(r() * 3)
    for (let i = 0; i < n; i++) {
      const size = i === 0 ? 40 + r() * 34 : 12 + r() * 26
      out.push([size, cx + (r() - 0.5) * 9, 2.2 + r() * 1.4, -r() * 3.4, 6 + r() * 14])
    }
  })
  return out
})()

function Bubble({ size }) {
  return (
    <svg viewBox="-12 -12 24 24" width={size} height={size} aria-hidden="true">
      <circle r="11" className="bub__rim" />
      <circle r="8" cx="1.6" cy="1.8" className="bub__core" />
      <ellipse rx="3.2" ry="2" cx="-4.6" cy="-5" transform="rotate(-35 -4.6 -5)" className="bub__hi" />
    </svg>
  )
}

function WaterArt() {
  return (
    <>
      <div className="water__waves">
        {WAVES.map((w) => (
          <svg
            key={w.cls}
            className={`water__wave water__wave--${w.cls}`}
            viewBox="0 0 2400 160"
            preserveAspectRatio="none"
          >
            <path className="water__fill" d={w.paths[0]} />
            <path className="water__crest" d={w.paths[1]} vectorEffect="non-scaling-stroke" />
          </svg>
        ))}
      </div>

      <div className="water__body">
        <div className="water__texture" />
      </div>

      <div className="water__bubbles">
        {BUBBLES.map(([size, left, dur, delay, sway], i) => (
          <span
            key={i}
            className="water__bubble"
            style={{
              left: `${left}%`,
              animationDuration: `${dur}s`,
              animationDelay: `${delay}s`,
            }}
          >
            <span className="water__bubble-sway" style={{ '--sway': `${sway}px`, animationDelay: `${delay}s` }}>
              <Bubble size={Math.round(size)} />
            </span>
          </span>
        ))}
      </div>
    </>
  )
}

export default memo(WaterArt)
