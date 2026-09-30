import { memo } from 'react'

/* The water is built from the pause-menu video itself: the body is a
   seamless texture cut from the video's water (public/images/water-texture.jpg),
   the surface waves use the exact colors sampled from it.
   Only transforms animate (compositor-friendly). */

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

    </>
  )
}

export default memo(WaterArt)
