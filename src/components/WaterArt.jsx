import { memo } from 'react'

/* Cel-shaded water, drawn to match the pause-menu video: a bright turquoise
   surface band with jagged ripple patches, deep blue below, light swaths and
   ring-shaded bubbles. All shapes are generated once at load; the only
   animation is transform/opacity on a few layers (compositor-friendly). */

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

/* ---- ripple patches: flat, jagged, horizontally stretched blobs ---- */
function ripple(r, cx, cy, w, h) {
  const n = 14 + Math.floor(r() * 8)
  let d = ''
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    // mostly-smooth outline with the odd hand-cut notch (cel look, not a star)
    const notch = r() < 0.18 ? 0.6 : 1
    const k = notch * (0.82 + r() * 0.3)
    // flatten the bottom edge a little, like light patches on a surface
    const yk = Math.sin(a) > 0 ? 0.7 : 1
    d += `${i ? 'L' : 'M'}${f(cx + Math.cos(a) * w * k)} ${f(cy + Math.sin(a) * h * k * yk)}`
  }
  return d + 'Z'
}

// one 1200×220 tile, drawn twice side by side so a -50% drift loops seamlessly
function rippleTile(seed) {
  const r = rng(seed)
  const light = []
  const dark = []
  // patches come in loose clusters (like light through a real surface)
  for (let c = 0; c < 7; c++) {
    const ccx = 80 + (c / 7) * 1040 + r() * 60
    const ccy = 18 + r() * 70
    const count = 3 + Math.floor(r() * 4)
    for (let i = 0; i < count; i++) {
      const cy = ccy + i * (14 + r() * 16)
      const scale = Math.max(0.35, 1 - cy / 240)
      const cx = ccx + (r() - 0.5) * 160
      light.push(ripple(r, cx, cy, (50 + r() * 110) * scale, (7 + r() * 9) * scale))
      if (r() < 0.6) dark.push(ripple(r, cx + (r() - 0.5) * 80, cy + 9 + r() * 8, (30 + r() * 70) * scale, (2.5 + r() * 3) * scale))
    }
  }
  return { light: light.join(''), dark: dark.join('') }
}
const RIPPLES = rippleTile(7)

/* ---- light swaths: tall flame-like streaks (the dive trail in the video) ---- */
function swath(r, x0, width, top) {
  const left = []
  const right = []
  const steps = 18
  for (let i = 1; i <= steps; i++) {
    const y = top + ((1000 - top) * i) / steps
    const wob = Math.sin(i * 0.5 + x0) * 14
    const w = width * Math.pow(i / steps, 0.6) // tapers to a point at the top
    left.push(`${f(x0 + wob - w / 2 - r() * 6)} ${f(y)}`)
    right.unshift(`${f(x0 + wob + w / 2 + r() * 6)} ${f(y)}`)
  }
  return `M${f(x0)} ${top} L${left.join(' L')} L${right.join(' L')}Z`
}
const SWATHS = (() => {
  const r = rng(21)
  return [swath(r, 240, 150, 160), swath(r, 540, 80, 300), swath(r, 800, 190, 90)]
})()

/* ---- bubbles: [size px, left %, rise s, delay s, sway px] ---- */
const BUBBLES = (() => {
  const r = rng(99)
  const out = []
  // clusters, like the video
  const clusters = [6, 17, 29, 41, 52, 64, 76, 88, 96]
  clusters.forEach((cx) => {
    const n = 4 + Math.floor(r() * 4)
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
        <svg className="water__swaths" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          {SWATHS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>

        <div className="water__ripples">
          <svg viewBox="0 0 2400 220" preserveAspectRatio="none">
            {[0, 1200].map((x) => (
              <g key={x} transform={`translate(${x} 0)`}>
                <path className="water__ripple-dark" d={RIPPLES.dark} />
                <path className="water__ripple-light" d={RIPPLES.light} />
              </g>
            ))}
          </svg>
        </div>
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
