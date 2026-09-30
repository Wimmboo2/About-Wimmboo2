import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import SaveRow, { SkeletonRow } from '../components/SaveRow.jsx'
import { githubUsername, projectFields, showProjectsWatermark, timezone } from '../content.js'
import { dateParts, moonPhase, timeOfDay } from '../lib/dates.js'
import { useGithubRepos } from '../lib/github.js'
import { useEscBack, useRevealed } from '../lib/transition.js'
import '../styles/projects.css'

const read = (slot, repo) => (typeof slot === 'function' ? slot(repo) : repo[slot])

// Repo → everything a SaveRow displays, via the projectFields mapping in content.js.
function toSlot(repo) {
  const f = projectFields
  const iso = read(f.date, repo)
  const date = dateParts(iso, timezone) || dateParts(new Date().toISOString(), timezone)
  return {
    key: repo.html_url + repo.name,
    date,
    timeOfDay: timeOfDay(date.hour),
    moon: moonPhase(iso),
    title: read(f.title, repo),
    subtitle: read(f.subtitle, repo),
    bigNumber: read(f.bigNumber, repo),
    bigNumberLabel: f.bigNumberLabel,
    bigNumberSpoken: f.bigNumberSpoken || f.bigNumberLabel,
    description: read(f.description, repo),
    stars: read(f.stars, repo) ?? 0,
    forks: read(f.forks, repo) ?? 0,
    tag: read(f.tag, repo),
    url: read(f.url, repo),
  }
}

export default function Projects() {
  useEscBack()
  const revealed = useRevealed()
  const { status, repos } = useGithubRepos(githubUsername, 3)
  const slots = useMemo(() => repos.map(toSlot), [repos])
  const [selected, setSelected] = useState(0)
  const selectedRef = useRef(0)
  selectedRef.current = selected
  const rowRefs = useRef([])

  useEffect(() => {
    if (!slots.length) return
    const onKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const dir = e.key === 'ArrowDown' ? 1 : -1
        const n = (selectedRef.current + dir + slots.length) % slots.length
        setSelected(n)
        rowRefs.current[n]?.focus()
      } else if (e.key === 'Enter' && !rowRefs.current.includes(document.activeElement)) {
        e.preventDefault()
        const url = slots[selectedRef.current]?.url
        if (url) window.open(url, '_blank', 'noopener,noreferrer')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slots])

  return (
    <main className="page page--projects">
      <h1 className="sr-only">Projects</h1>
      {showProjectsWatermark && (
        <div className="projects__watermark" aria-hidden="true">
          PROJECTS
        </div>
      )}

      <motion.div
        className="projects__wrap ui-zoom"
        initial={{ opacity: 0, x: 60 }}
        animate={revealed ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        <ol className="projects__list" aria-label="Recent GitHub repositories" aria-busy={status === 'loading'}>
          {status === 'loading'
            ? [0, 1, 2].map((i) => <SkeletonRow key={i} index={i} />)
            : slots.map((slot, i) => (
                <SaveRow
                  key={slot.key}
                  ref={(el) => (rowRefs.current[i] = el)}
                  slot={slot}
                  index={i}
                  selected={i === selected}
                  onSelect={() => setSelected(i)}
                />
              ))}
        </ol>
        {status === 'offline' && <p className="projects__offline">offline data</p>}
      </motion.div>
    </main>
  )
}
