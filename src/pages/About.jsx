import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { about } from '../content.js'
import { useEscBack, useRevealed } from '../lib/transition.js'
import '../styles/about.css'

const CHAR_MS = 26

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Types `lines` out once `start` is true. Returns [chars shown, done, skip()].
function useTypewriter(lines, start) {
  const total = lines.join('').length
  const [count, setCount] = useState(() => (prefersReducedMotion() ? total : 0))
  useEffect(() => {
    if (!start || count >= total) return
    const t = setTimeout(() => setCount((c) => c + 1), CHAR_MS)
    return () => clearTimeout(t)
  }, [start, count, total])
  return [count, count >= total, () => setCount(total)]
}

// P3R-style message window: name tag + typed text + bouncing ▼.
function Dialogue() {
  const revealed = useRevealed()
  const [count, done, skip] = useTypewriter(about.intro, revealed)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (!done) {
          e.preventDefault()
          skip()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  let left = count
  return (
    <section className="dlg" aria-labelledby="dlg-name" onClick={skip}>
      <h2 className="dlg__name" id="dlg-name">
        <span className="dlg__name-text">{about.name}</span>
      </h2>
      <div className="dlg__box">
        <div className="dlg__text">
          <div className="sr-only">
            {about.intro.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
          {about.intro.map((line) => {
            const shown = line.slice(0, Math.max(0, left))
            left -= line.length
            return (
              <p key={line} aria-hidden="true">
                <span>{shown}</span>
                <span className="dlg__ghost">{line.slice(shown.length)}</span>
              </p>
            )
          })}
        </div>
        {done && <span className="dlg__next" aria-hidden="true" />}
      </div>
    </section>
  )
}

function Facts() {
  const [sel, setSel] = useState(0)
  const selRef = useRef(0)
  selRef.current = sel
  const refs = useRef([])
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      e.preventDefault()
      const n = (selRef.current + (e.key === 'ArrowDown' ? 1 : -1) + about.facts.length) % about.facts.length
      setSel(n)
      refs.current[n]?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <section className="facts" aria-labelledby="facts-h">
      <h2 className="facts__h" id="facts-h">
        FACTS
      </h2>
      <ul className="facts__list">
        {about.facts.map((f, i) => {
          const isSel = i === sel
          return (
            <li key={f.title} className="facts__item" style={{ '--i': i }}>
              <div
                ref={(el) => (refs.current[i] = el)}
                tabIndex={0}
                className={`fact ${isSel ? 'is-selected' : ''}`}
                onMouseEnter={() => setSel(i)}
                onFocus={() => setSel(i)}
                onClick={() => setSel(i)}
              >
                {isSel && (
                  <motion.span
                    className="fact__hl"
                    aria-hidden="true"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.14, ease: [0.2, 0.9, 0.3, 1] }}
                  >
                    <span className="fact__hl-red" />
                    <span className="fact__hl-white" />
                  </motion.span>
                )}
                <span className="fact__title">{f.title}</span>
                <span className="fact__text">{f.text}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default function About() {
  useEscBack()
  const revealed = useRevealed()

  return (
    <main className="page page--about">
      <motion.div
        className="about ui-zoom"
        initial={{ opacity: 0, x: -60 }}
        animate={revealed ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      >
        <h1 className="about__heading">
          <motion.span
            className="blade"
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: revealed ? 1 : 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.9, 0.3, 1], delay: 0.25 }}
          >
            <span className="blade__red" />
            <span className="blade__white" />
          </motion.span>
          <span className="blade-text">ABOUT ME</span>
        </h1>

        <Dialogue />
        <Facts />
      </motion.div>
    </main>
  )
}
