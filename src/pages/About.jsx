import { motion } from 'framer-motion'
import { about } from '../content.js'
import { useEscBack, useRevealed } from '../lib/transition.js'
import '../styles/about.css'

const ease = [0.22, 1, 0.36, 1]

export default function About() {
  useEscBack()
  const revealed = useRevealed()
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

        <div className="about__text">
          <p className="about__lead">{first}</p>
          {rest.map((line) => (
            <p key={line}>{line}</p>
          ))}

          <ul className="about__lines">
            {about.facts.map((f) => (
              <li key={f.title}>
                <span className="about__label">{f.title}:</span> {f.text}
              </li>
            ))}
          </ul>

          <ul className="about__lines">
            <li>
              <a href={about.gameOst.url} target="_blank" rel="noopener noreferrer">
                {about.gameOst.label}
              </a>
            </li>
            <li>
              <a href={about.nonGameOst.url} target="_blank" rel="noopener noreferrer">
                {about.nonGameOst.label}
              </a>
            </li>
            <li>
              <span className="about__label">discord:</span> {about.discord}
            </li>
          </ul>
        </div>
      </motion.div>
    </main>
  )
}
