import { motion } from 'framer-motion'
import { about } from '../content.js'
import { useEscBack, useRevealed } from '../lib/transition.js'
import '../styles/about.css'

const ease = [0.22, 1, 0.36, 1]

// One big P3R "reveal" panel: a white slab tilted across the screen with two
// black bars on it (intro on top, facts below), plus a big stroked title.
export default function About() {
  useEscBack()
  const revealed = useRevealed()
  const [lead, ...rest] = about.intro

  return (
    <main className="page page--about">
      <motion.h1
        className="about-title"
        initial={{ opacity: 0, scale: 0.55, y: -10 }}
        animate={revealed ? { opacity: 1, scale: [0.55, 1.1, 1], y: [-10, 2, 0] } : { opacity: 0, scale: 0.55, y: -10 }}
        transition={{ duration: 0.38, ease, delay: 0.2 }}
      >
        ABOUT ME
      </motion.h1>

      <motion.section
        className="reveal"
        aria-label="About me"
        initial={{ opacity: 0, x: -120, scaleX: 0.72 }}
        animate={
          revealed
            ? { opacity: [0, 0.98, 1], x: [-120, 18, 0], scaleX: [0.72, 1.03, 1] }
            : { opacity: 0, x: -120, scaleX: 0.72 }
        }
        transition={{ duration: 0.46, ease, times: [0, 0.6, 1] }}
      >
        <div className="reveal__upper">
          <p className="reveal__lead">{lead}</p>
          {rest.map((line) => (
            <p key={line} className="reveal__line">
              {line}
            </p>
          ))}
        </div>

        <div className="reveal__lower">
          <h2 className="sr-only">Facts</h2>
          <dl className="reveal__facts">
            {about.facts.map((f) => (
              <div key={f.title} className="reveal__fact">
                <dt>{f.title}</dt>
                <dd>{f.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </motion.section>
    </main>
  )
}
