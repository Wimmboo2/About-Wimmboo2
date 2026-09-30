import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { TransitionContext } from '../lib/transition.js'
import { waitForBgVideo } from '../lib/videoCache.js'
import '../styles/water.css'

const RISE_MS = 900
const DRAIN_MS = 900
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'

// A periodic sine wave filled down to the bottom of the viewBox.
// Width holds exactly 4 wavelengths, so translating the (200% wide) SVG
// by -50% loops seamlessly.
// Returns [filled shape, crest line].
function wavePaths({ width = 2400, height = 160, base, amp, waves = 4, step = 15 }) {
  const k = (Math.PI * 2 * waves) / width
  // Stokes-style 2nd harmonic: peaky crests, flatter troughs (less "screensaver sine")
  const y = (x) => (base - amp * (Math.sin(x * k) - 0.25 * Math.cos(2 * x * k))).toFixed(1)
  let line = `M0 ${y(0)}`
  for (let x = step; x <= width; x += step) line += ` L${x} ${y(x)}`
  return [`${line} L${width} ${height} L0 ${height} Z`, line]
}

const WAVES = [
  { cls: 'back', paths: wavePaths({ base: 62, amp: 30, waves: 6 }) },
  { cls: 'mid', paths: wavePaths({ base: 96, amp: 24, waves: 4 }) },
  { cls: 'front', paths: wavePaths({ base: 124, amp: 18, waves: 8 }) },
]

// size (px), left (%), duration (s), delay (s)
// negative delays → bubbles are already mid-flight when the water appears
const BUBBLES = [
  [14, 6, 2.4, -1.2], [9, 14, 1.9, -0.4], [24, 22, 2.8, -2.0], [12, 31, 2.1, -0.9],
  [18, 40, 2.6, -1.6], [9, 48, 1.8, -0.2], [28, 57, 3.0, -1.1], [12, 64, 2.2, -1.9],
  [18, 72, 2.5, -0.6], [9, 79, 1.7, -1.3], [20, 86, 2.7, -2.3], [13, 94, 2.0, -0.8],
  [10, 27, 2.3, -1.7], [16, 68, 2.9, -0.3],
]

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()))

export default function WaterTransition({ children, knownPaths }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [displayedLocation, setDisplayedLocation] = useState(location)
  const [phase, setPhase] = useState('idle') // idle | rising | covered | draining
  const busyRef = useRef(false)
  const latestLocation = useRef(location)
  latestLocation.current = location
  const rootRef = useRef(null)
  const sheetRef = useRef(null)

  // Web Animations API → runs on the compositor, so it stays smooth even while
  // React mounts the next page underneath.
  const play = useCallback((keyframes, duration) => {
    const el = prefersReducedMotion() ? rootRef.current : sheetRef.current
    const anim = el.animate(keyframes, { duration, easing: EASE, fill: 'forwards' })
    return anim.finished.catch(() => {})
  }, [])

  const run = useCallback(async () => {
    busyRef.current = true
    const reduced = prefersReducedMotion()
    const root = rootRef.current
    root.classList.add('is-active')
    root.dataset.mode = reduced ? 'fade' : 'water'

    setPhase('rising')
    if (reduced) {
      await play([{ opacity: 0 }, { opacity: 1 }], 180)
    } else {
      await play([{ transform: 'translate3d(0,100%,0)' }, { transform: 'translate3d(0,0,0)' }], RISE_MS)
    }

    // Fully covered: swap route + background video underneath.
    flushSync(() => {
      setPhase('covered')
      setDisplayedLocation(latestLocation.current)
    })
    await waitForBgVideo(700)
    await nextFrame()
    await nextFrame()

    setPhase('draining')
    if (reduced) {
      await play([{ opacity: 1 }, { opacity: 0 }], 180)
    } else {
      await play([{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(0,100%,0)' }], DRAIN_MS)
    }

    root.classList.remove('is-active')
    sheetRef.current.getAnimations().forEach((a) => a.cancel())
    root.getAnimations().forEach((a) => a.cancel())
    busyRef.current = false
    setPhase('idle')
  }, [play])

  // Any location change (link, Esc, browser back/forward) goes through the water.
  useEffect(() => {
    if (busyRef.current || phase !== 'idle') return
    // same page, or leaving an unknown URL that is just redirecting to "/": no water
    if (location.pathname === displayedLocation.pathname || !knownPaths.includes(displayedLocation.pathname)) {
      if (location.key !== displayedLocation.key) setDisplayedLocation(location)
      return
    }
    run()
  }, [location, displayedLocation, phase, run, knownPaths])

  // Swallow keyboard input while the water is moving.
  useEffect(() => {
    const block = (e) => {
      if (busyRef.current) {
        e.preventDefault()
        e.stopImmediatePropagation()
      }
    }
    window.addEventListener('keydown', block, true)
    return () => window.removeEventListener('keydown', block, true)
  }, [])

  const go = useCallback(
    (path) => {
      if (busyRef.current || path === latestLocation.current.pathname) return
      navigate(path)
    },
    [navigate],
  )

  const back = useCallback(() => {
    if (busyRef.current || latestLocation.current.pathname === '/') return
    const idx = window.history.state?.idx
    if (typeof idx === 'number' && idx > 0) navigate(-1)
    else navigate('/', { replace: true })
  }, [navigate])

  const value = useMemo(
    () => ({ displayedLocation, phase, busy: phase !== 'idle', go, back }),
    [displayedLocation, phase, go, back],
  )

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <div ref={rootRef} className="water" aria-hidden="true">
        <div ref={sheetRef} className="water__sheet">
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
            <div className="water__shafts">
              <span className="water__shaft water__shaft--1" />
              <span className="water__shaft water__shaft--2" />
              <span className="water__shaft water__shaft--3" />
            </div>
          </div>
          <div className="water__bubbles">
            {BUBBLES.map(([size, left, dur, delay], i) => (
              <span
                key={i}
                className="water__bubble"
                style={{
                  width: size,
                  height: size,
                  left: `${left}%`,
                  animationDuration: `${dur}s`,
                  animationDelay: `${delay}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </TransitionContext.Provider>
  )
}
