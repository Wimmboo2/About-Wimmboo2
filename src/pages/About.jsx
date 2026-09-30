import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { about } from '../content.js'
import { useEscBack, useRevealed } from '../lib/transition.js'
import '../styles/about.css'

const ease = [0.22, 1, 0.36, 1]

export default function About() {
  useEscBack()
  const revealed = useRevealed()
  const [sel, setSel] = useState(0)
  const selRef = useRef(0)
  selRef.current = sel
  const rowRefs = useRef([])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      e.preventDefault()
      const n = (selRef.current + (e.key === 'ArrowDown' ? 1 : -1) + about.facts.length) % about.facts.length
      setSel(n)
      rowRefs.current[n]?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const [first, ...rest] = about.intro

  return (
    <main className="page page--about">
      {/* one big diagonal slab, bleeding off the left edge */}
      <motion.div
        className="slab"
        aria-hidden="true"
        initial={{ x: '-100%' }}
        animate={{ x: revealed ? 0 : '-100%' }}
        transition={{ duration: 0.45, ease }}
      >
        <span className="slab__white" />
        <span className="slab__cyan" />
        <span className="slab__fill" />
      </motion.div>

      <motion.div
        className="about ui-zoom"
        initial={{ opacity: 0, x: -40 }}
        animate={revealed ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
        transition={{ duration: 0.4, ease, delay: 0.18 }}
      >
        <h1 className="about__title">ABOUT ME</h1>

        <div className="about__intro">
          <p className="about__lead">{first}</p>
          {rest.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <h2 className="sr-only">Facts</h2>
        <ul className="about__facts">
          {about.facts.map((f, i) => {
            const isSel = i === sel
            return (
              <li key={f.title}>
                <div
                  ref={(el) => (rowRefs.current[i] = el)}
                  tabIndex={0}
                  className={`fact ${isSel ? 'is-selected' : ''}`}
                  onMouseEnter={() => setSel(i)}
                  onFocus={() => setSel(i)}
                  onClick={() => setSel(i)}
                >
                  {isSel && (
                    <motion.span
                      layoutId="fact-bar"
                      className="fact__bar"
                      aria-hidden="true"
                      transition={{ type: 'spring', stiffness: 600, damping: 44 }}
                    >
                      <span className="fact__bar-red" />
                      <span className="fact__bar-white" />
                    </motion.span>
                  )}
                  <span className="fact__title">{f.title}</span>
                  <span className="fact__text">{f.text}</span>
                </div>
              </li>
            )
          })}
        </ul>
      </motion.div>
    </main>
  )
}
