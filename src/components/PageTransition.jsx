import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { TransitionContext } from '../lib/transition.js'
import '../styles/transition.css'

/* Slanted band swipe, in P3R's flat menu style.
   Four hard-edged bands lean 22° and sweep in from the left one after another
   (cyan, white, blue, navy). Once navy covers the screen the page and the
   background video swap underneath, then the bands sweep off to the right in
   reverse order (navy first), uncovering the new page. ~0.6s total. */

const SLANT_DEG = 22
const IN_MS = 200
const OUT_MS = 210
// [css class, delay before sweeping in, delay before sweeping out] (ms)
const BANDS = [
  ['cyan', 0, 110],
  ['white', 25, 90],
  ['blue', 50, 55],
  ['navy', 80, 20],
]
const COVERED_MS = 80 + IN_MS // navy has fully covered the screen (it holds for 20ms)
const SWAP_MS = COVERED_MS + 8
const TOTAL_MS = COVERED_MS + 110 + OUT_MS
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'
const FADE_MS = 140 // prefers-reduced-motion: navy fades in and out instead

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default function PageTransition({ children, knownPaths }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [displayedLocation, setDisplayedLocation] = useState(location)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const latestLocation = useRef(location)
  latestLocation.current = location
  const rootRef = useRef(null)
  const bandRefs = useRef([])

  const run = useCallback(async () => {
    busyRef.current = true
    await null // start outside React's effect phase (flushSync isn't allowed inside it)
    const root = rootRef.current
    root.classList.add('is-active')
    setBusy(true)

    let anims
    if (prefersReducedMotion()) {
      const navy = bandRefs.current[BANDS.length - 1]
      anims = [
        navy.animate(
          [
            { transform: 'none', opacity: 0 },
            { transform: 'none', opacity: 1, offset: 0.4 },
            { transform: 'none', opacity: 1, offset: 0.6 },
            { transform: 'none', opacity: 0 },
          ],
          { duration: FADE_MS * 2.5 },
        ),
      ]
      await sleep(FADE_MS)
    } else {
      // Bands are as wide as the slanted screen; their left edge travels
      // -width → 0 (sweeping in) → +width (sweeping out).
      const W = window.innerWidth
      const H = window.innerHeight
      const width = W + H * Math.tan((SLANT_DEG * Math.PI) / 180) + 40
      const at = (x) => `translateX(${x}px) skewX(${SLANT_DEG}deg)`
      anims = BANDS.map(([, inDelay, outDelay], i) => {
        const el = bandRefs.current[i]
        el.style.width = `${width}px`
        const o = (ms) => ms / TOTAL_MS
        return el.animate(
          [
            { transform: at(-width), offset: 0 },
            { transform: at(-width), offset: o(inDelay), easing: EASE },
            { transform: at(0), offset: o(inDelay + IN_MS) },
            { transform: at(0), offset: o(COVERED_MS + outDelay), easing: EASE },
            { transform: at(width), offset: o(COVERED_MS + outDelay + OUT_MS) },
            { transform: at(width), offset: 1 },
          ],
          { duration: TOTAL_MS },
        )
      })
      // swap on the animation's own clock, while navy is holding still
      const navyAnim = anims[anims.length - 1]
      await new Promise((resolve) => {
        const check = () => ((navyAnim.currentTime ?? 0) >= SWAP_MS ? resolve() : requestAnimationFrame(check))
        check()
      })
    }

    // Screen is covered: swap the page (and, via BackgroundVideo, the video).
    flushSync(() => setDisplayedLocation(latestLocation.current))
    window.scrollTo(0, 0)

    await Promise.all(anims.map((a) => a.finished.catch(() => {})))
    root.classList.remove('is-active')
    busyRef.current = false
    setBusy(false)
  }, [])

  // Any location change (menu, Esc, browser back/forward) goes through the transition.
  useEffect(() => {
    if (busyRef.current) return
    if (location.pathname === displayedLocation.pathname || !knownPaths.includes(displayedLocation.pathname)) {
      // same page, or leaving an unknown URL that is just redirecting to "/": no transition
      if (location.key !== displayedLocation.key) setDisplayedLocation(location)
      return
    }
    run()
  }, [location, displayedLocation, busy, run, knownPaths])

  // Swallow keyboard input while a transition runs.
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

  const value = useMemo(() => ({ displayedLocation, busy, go, back }), [displayedLocation, busy, go, back])

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <div ref={rootRef} className="xfade" aria-hidden="true">
        {BANDS.map(([color], i) => (
          <div key={color} ref={(el) => (bandRefs.current[i] = el)} className={`xfade__band xfade__band--${color}`} />
        ))}
      </div>
    </TransitionContext.Provider>
  )
}
