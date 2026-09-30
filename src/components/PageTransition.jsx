import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { routeBackgrounds } from '../content.js'
import { TransitionContext } from '../lib/transition.js'
import { drawBgFrame, pauseBgVideo, resumeBgVideo } from '../lib/videoCache.js'
import '../styles/transition.css'

/* P3R submenu transition (numbers from Ultipuk's Godot recreation of the
   P3R pause menu: blot_cut_mask + double_circular_cut_mask shaders).

   1. "Blot": a wavy circle grows from (26%, 38.5%) over 0.3s, progress
      0.1 → 1, filled with a zoomed (×1/0.6) copy of the screen tinted
      (r×0.25, g×0.5, b). 5 waves, amplitude 0.1, rotating 0.4π over the run.
   2. At 0.15s the new page is revealed through two circles growing over
      0.2s, centered at (75%, 10%) and (25%, 90%), the second at 0.8× size.
   Total 0.35s. Both use hard edges, like the shaders' step(). */

const BLOT = { cx: 0.26, cy: 0.385, amp: 0.1, period: 5, baseRot: 0, addRot: 0.4, ms: 300, from: 0.1 }
const REVEAL = { delay: 150, ms: 200, c1: [0.75, 0.1], c2: [0.25, 0.9], scale2: 0.8 }
const TOTAL = REVEAL.delay + REVEAL.ms
const FADE_MS = 180 // prefers-reduced-motion
const BLOT_POINTS = 180

const videoFor = (pathname) => (routeBackgrounds[pathname] || routeBackgrounds['/']).video

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Outline of the blot at progress p, as an SVG path in px.
function blotPath(p, W, H) {
  const ar = W / H
  const { cx, cy, amp, period, baseRot, addRot } = BLOT
  const acx = ar * cx
  // circumradius to the (amplitude-extended) corners, in screen-height units
  const R = Math.max(
    Math.hypot(acx, cy),
    Math.hypot(acx, cy - (1 + amp)),
    Math.hypot(acx - ar * (1 + amp), cy),
    Math.hypot(acx - ar * (1 + amp), cy - (1 + amp)),
  )
  let d = ''
  for (let i = 0; i < BLOT_POINTS; i++) {
    const a = (i / BLOT_POINTS) * Math.PI * 2
    const offset = amp * Math.sin(Math.PI * baseRot + period * (a - p * addRot * Math.PI))
    const r = Math.max(0, p * (R - offset)) * H
    const x = cx * W + r * Math.cos(a)
    const y = cy * H - r * Math.sin(a)
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return `path('${d}Z')`
}

const circle = (x, y, r) =>
  `M${(x - r).toFixed(1)} ${y.toFixed(1)}A${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(x + r).toFixed(1)} ${y.toFixed(1)}` +
  `A${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(x - r).toFixed(1)} ${y.toFixed(1)}Z`

// Union of the two reveal circles at progress p, as an SVG path in px.
function revealPath(p, W, H) {
  if (p <= 0) return 'path("M0 0Z")'
  const [x1, y1] = [REVEAL.c1[0] * W, REVEAL.c1[1] * H]
  const [x2, y2] = [REVEAL.c2[0] * W, REVEAL.c2[1] * H]
  const R = Math.max(Math.hypot(x1, y1), Math.hypot(x1, y1 - H), Math.hypot(x1 - W, y1), Math.hypot(x1 - W, y1 - H))
  return `path('${circle(x1, y1, p * R)}${circle(x2, y2, p * R * REVEAL.scale2)}')`
}

const setClip = (el, value) => {
  el.style.clipPath = value
  el.style.webkitClipPath = value
}

export default function PageTransition({ children, knownPaths }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [displayedLocation, setDisplayedLocation] = useState(location)
  const [incoming, setIncoming] = useState(null) // { location, backdrop: 'snapshot' | 'poster' }
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const latestLocation = useRef(location)
  latestLocation.current = location

  const rootRef = useRef(null)
  const blotRef = useRef(null)
  const incomingRef = useRef(null)
  const snapshotRef = useRef(null)

  const run = useCallback(async () => {
    busyRef.current = true
    await null // start outside React's effect phase (flushSync isn't allowed inside it)
    const target = latestLocation.current
    const sameVideo = videoFor(target.pathname) === videoFor(displayedLocation.pathname)
    const reduced = prefersReducedMotion()
    const W = window.innerWidth
    const H = window.innerHeight

    // Freeze the background so the blot's snapshot and the video agree.
    pauseBgVideo()
    const blot = blotRef.current
    blot.width = W
    blot.height = H
    if (!reduced) drawBgFrame(blot, { zoom: 0.6, tint: 'rgb(64 128 255)' })

    // Mount the incoming page (hidden) on top, with its own backdrop.
    flushSync(() => {
      setBusy(true)
      setIncoming({ location: target, backdrop: sameVideo ? 'snapshot' : 'poster' })
    })
    const layer = incomingRef.current
    if (sameVideo && snapshotRef.current) {
      snapshotRef.current.width = W
      snapshotRef.current.height = H
      drawBgFrame(snapshotRef.current)
    }
    rootRef.current.classList.add('is-active')

    await new Promise((resolve) => {
      const t0 = performance.now()
      if (reduced) {
        setClip(layer, 'none')
        layer.style.opacity = '0'
      } else {
        setClip(layer, revealPath(0, W, H))
        setClip(blot, blotPath(BLOT.from, W, H))
        blot.classList.add('is-on')
      }
      const frame = (now) => {
        const t = now - t0
        if (reduced) {
          layer.style.opacity = String(Math.min(1, t / FADE_MS))
          if (t >= FADE_MS) return resolve()
        } else {
          const pb = BLOT.from + (1 - BLOT.from) * Math.min(1, t / BLOT.ms)
          setClip(blot, blotPath(pb, W, H))
          const pr = Math.min(1, Math.max(0, (t - REVEAL.delay) / REVEAL.ms))
          setClip(layer, revealPath(pr, W, H))
          if (t >= TOTAL) return resolve()
        }
        requestAnimationFrame(frame)
      }
      requestAnimationFrame(frame)
    })

    // Hand over. Clean up the DOM first (the layer fully covers the screen by
    // now, so none of this is visible), then let React swap: the incoming
    // layer becomes the page (same key, no remount) and the background video
    // switches underneath its identical first frame.
    setClip(layer, '')
    layer.style.opacity = ''
    blot.classList.remove('is-on')
    setClip(blot, '')
    rootRef.current.classList.remove('is-active')
    if (sameVideo) resumeBgVideo()
    busyRef.current = false
    flushSync(() => {
      setDisplayedLocation(target)
      setIncoming(null)
      setBusy(false)
    })
    window.scrollTo(0, 0)
  }, [displayedLocation])

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

  const value = useMemo(
    () => ({ displayedLocation, incoming, busy, go, back, incomingRef, snapshotRef }),
    [displayedLocation, incoming, busy, go, back],
  )

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <canvas ref={blotRef} className="xfade__blot" aria-hidden="true" />
      <div ref={rootRef} className="xfade" aria-hidden="true" />
    </TransitionContext.Provider>
  )
}
