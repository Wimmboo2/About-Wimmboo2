import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { githubMode, githubUsername, menuItems } from '../content.js'
import { useRevealed, useTransitionNav } from '../lib/transition.js'

const githubUrl = `https://github.com/${githubUsername}`

const itemVariants = {
  hidden: { x: 36, opacity: 0 },
  shown: (i) => ({
    x: 0,
    opacity: 1,
    transition: { delay: 0.08 + i * 0.08, duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  }),
}

// P3R pause menu, ported from blairxu13/persona3-website's P3Menu: the selected
// item gets a white triangle (with a pink one popping behind it) and turns red,
// bright inside the triangle, dark outside. Unselected items fade with distance.
export default function Menu() {
  const { go, busy } = useTransitionNav()
  const revealed = useRevealed()
  const [selected, setSelected] = useState(0)
  const [pop, setPop] = useState(0) // bumps to replay the pink pop
  const selectedRef = useRef(0)
  selectedRef.current = selected
  const linkRefs = useRef([])

  const select = (i) => {
    if (i === selectedRef.current) return
    setSelected(i)
    setPop((p) => p + 1)
  }

  const hrefFor = (item) =>
    item.github ? (githubMode === 'profile' ? githubUrl : '/github') : item.to

  const isExternal = (item) => item.github && githubMode === 'profile'

  const activate = (item) => {
    if (busy) return
    if (isExternal(item)) window.open(githubUrl, '_blank', 'noopener,noreferrer')
    else go(hrefFor(item))
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const dir = e.key === 'ArrowDown' ? 1 : -1
        const n = (selectedRef.current + dir + menuItems.length) % menuItems.length
        select(n)
        linkRefs.current[n]?.focus()
      } else if (e.key === 'Enter' && !linkRefs.current.includes(document.activeElement)) {
        // Enter with nothing focused → activate the highlighted item
        e.preventDefault()
        activate(menuItems[selectedRef.current])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <nav className="menu" aria-label="Main menu">
      <ul className="menu__list">
        {menuItems.map((item, i) => {
          const isSel = i === selected
          const external = isExternal(item)
          const dist = Math.abs(i - selected)
          // their triangle size: width = chars × size × 0.6 + 80, height = size × 0.94
          const w = item.label.length * item.size * 0.6 + 80
          const h = item.size * 0.94
          const px = (n) => `calc(${n} * var(--u))`
          const tri = { width: px(w), height: px(h) }
          const clip = `polygon(0px 0px, ${px(w)} ${px(h / 2)}, 0px ${px(h)})`
          return (
            <motion.li
              key={item.id}
              className="menu__item"
              style={{
                '--size': item.size,
                marginRight: `calc(${item.x} * var(--u))`,
                marginTop: `calc(${item.y} * var(--u))`,
              }}
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate={revealed ? 'shown' : 'hidden'}
            >
              <div className="menu__bob" style={{ animationDelay: `${i * -1.1}s` }}>
                <a
                  ref={(el) => (linkRefs.current[i] = el)}
                  href={hrefFor(item)}
                  className={`menu__link ${isSel ? 'is-selected' : ''}`}
                  aria-current={isSel ? 'true' : undefined}
                  {...(external
                    ? { target: '_blank', rel: 'noopener noreferrer', 'aria-label': `${item.label} (opens in a new tab)` }
                    : {})}
                  onMouseEnter={() => select(i)}
                  onFocus={() => select(i)}
                  onClick={(e) => {
                    select(i)
                    if (external && !busy) return // let the browser open the new tab
                    e.preventDefault()
                    activate(item)
                  }}
                >
                  <span
                    className="menu__skew"
                    style={{ transform: `skewX(${item.skew}deg) skewY(${item.skewY}deg)` }}
                  >
                    <span
                      key={isSel ? `pop-${pop}` : 'idle'}
                      className={`menu__pink ${isSel ? 'is-on' : ''}`}
                      style={{ ...tri, clipPath: clip }}
                      aria-hidden="true"
                    />
                    <span className="menu__white" style={{ ...tri, clipPath: clip }} aria-hidden="true" />
                    <span className="menu__label" style={{ opacity: isSel ? 1 : Math.max(0.5, 1 - dist * 0.2) }}>
                      <span className="menu__text">{item.label}</span>
                      <span className="menu__text menu__text--bright" style={{ clipPath: clip }} aria-hidden="true">
                        {item.label}
                      </span>
                    </span>
                  </span>
                </a>
              </div>
            </motion.li>
          )
        })}
      </ul>
    </nav>
  )
}
