import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import NumberTab from '../components/NumberTab.jsx'
import SlantedPanel from '../components/SlantedPanel.jsx'
import StatBar from '../components/StatBar.jsx'
import TabStrip from '../components/TabStrip.jsx'
import { about } from '../content.js'
import { useEscBack, useRevealed } from '../lib/transition.js'
import '../styles/about.css'

const TABS = [
  { id: 'bio', label: 'BIO' },
  { id: 'skills', label: 'SKILLS' },
  { id: 'facts', label: 'FACTS' },
]

const swap = {
  initial: { opacity: 0, x: 48, skewX: -10 },
  animate: { opacity: 1, x: 0, skewX: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -32, skewX: 8, transition: { duration: 0.12, ease: 'easeIn' } },
}

function Bio() {
  return (
    <div className="bio">
      <NumberTab n={1} className="panel__tab" />
      <h2 className="panel__bar">{about.name}</h2>
      <p className="bio__role">{about.role}</p>
      <p className="bio__text">{about.bio}</p>
    </div>
  )
}

function Skills() {
  return (
    <div className="skills">
      <NumberTab n={2} className="panel__tab" />
      <h2 className="panel__bar">SKILLS</h2>
      <ul className="skills__list">
        {about.skills.map((s, i) => (
          <StatBar key={s.label} label={s.label} value={s.value} index={i} />
        ))}
      </ul>
    </div>
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
    <div className="facts">
      <NumberTab n={3} className="panel__tab" />
      <h2 className="panel__bar">FACTS</h2>
      <ul className="facts__list">
        {about.facts.map((f, i) => (
          <li key={f.title}>
            <div
              ref={(el) => (refs.current[i] = el)}
              tabIndex={0}
              className={`fact ${i === sel ? 'is-selected' : ''}`}
              onMouseEnter={() => setSel(i)}
              onFocus={() => setSel(i)}
              onClick={() => setSel(i)}
            >
              <span className="fact__bg" aria-hidden="true">
                <span className="fact__bg-inner" />
              </span>
              <NumberTab n={i + 1} />
              <span className="fact__title">{f.title}</span>
              <span className="fact__text">{f.text}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

const PANELS = { bio: Bio, skills: Skills, facts: Facts }

export default function About() {
  useEscBack()
  const revealed = useRevealed()
  const [tab, setTab] = useState(0)
  const tabRef = useRef(0)
  tabRef.current = tab

  const switchTab = (dir) => {
    const n = (tabRef.current + dir + TABS.length) % TABS.length
    setTab(n)
    // keep keyboard focus on the tab strip if it was there
    if (document.activeElement?.getAttribute('role') === 'tab') {
      document.getElementById(`about-${TABS[n].id}`)?.focus()
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'arrowleft' || k === 'q') {
        e.preventDefault()
        switchTab(-1)
      } else if (k === 'arrowright' || k === 'e') {
        e.preventDefault()
        switchTab(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const Panel = PANELS[TABS[tab].id]

  return (
    <main className="page page--about">
      <motion.div
        className="about ui-zoom"
        initial={{ opacity: 0, x: -60 }}
        animate={revealed ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        <h1 className="about__heading">
          <span className="about__heading-tag" aria-hidden="true" />
          <span className="about__heading-text">ABOUT ME</span>
        </h1>

        <TabStrip tabs={TABS} selected={tab} onSelect={setTab} idPrefix="about" />

        <SlantedPanel
          as="section"
          className="about__panel"
          id="about-panel"
          role="tabpanel"
          aria-labelledby={`about-${TABS[tab].id}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={TABS[tab].id} className="about__content" {...swap}>
              <Panel />
            </motion.div>
          </AnimatePresence>
        </SlantedPanel>
      </motion.div>
    </main>
  )
}
