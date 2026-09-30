import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { TransitionContext } from '../lib/transition.js'
import { waitForBgVideo } from '../lib/videoCache.js'
import WaterArt from './WaterArt.jsx'
import '../styles/water.css'

const RISE_MS = 900
const DRAIN_MS = 900
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'

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
          <WaterArt />
        </div>
      </div>
    </TransitionContext.Provider>
  )
}
