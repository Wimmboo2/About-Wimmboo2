import { about } from '../content.js'
import { useEscBack } from '../lib/transition.js'
import '../styles/about.css'

// Built like P3R's submenu lists (the BGM/playlist screen): a title sitting on
// the top edge of a navy band, one cyan row per line, and the game's selected-
// row look (white bar, thin pink-red line on top) on the clickable rows.
export default function About() {
  useEscBack()

  return (
    <main className="page page--about">
      <div className="about">
        <h1 className="about__title">ABOUT ME</h1>
        <div className="about__band">
          {about.intro.map((line) => (
            <p key={line} className="about__row">
              {line}
            </p>
          ))}

          <div className="about__gap" />
          {about.facts.map((f) => (
            <p key={f.title} className="about__row">
              <span className="about__label">{f.title}:</span> {f.text}
            </p>
          ))}

          <div className="about__gap" />
          {[about.gameOst, about.nonGameOst].map((link) => (
            <a
              key={link.label}
              className="about__row about__row--link"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}
          <p className="about__row">
            <span className="about__label">discord:</span> {about.discord}
          </p>
        </div>
      </div>
    </main>
  )
}
