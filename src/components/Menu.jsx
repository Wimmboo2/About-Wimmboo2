import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { githubMode, githubUsername, menuItems } from '../content.js'
import { useRevealed, useTransitionNav } from '../lib/transition.js'

const githubUrl = `https://github.com/${githubUsername}`

const itemVariants = {
  hidden: { x: '60vw', opacity: 0 },
  shown: (i) => ({
    x: 0,
    opacity: 1,
    transition: { delay: 0.05 + i * 0.09, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
}

// Each item floats at its own angle, like the P3R pause menu.
// r = tilt (deg), ry = perspective turn (deg), x = sideways offset (em of the item)
const POSES = [
  { r: 7, ry: -16, x: 0 },
  { r: -5, ry: 12, x: 0.55 },
  { r: -2, ry: -8, x: 0.05 },
  { r: 1, ry: 10, x: 0.45 },
  { r: 5, ry: -12, x: -0.1 },
]

// Selected item = red text on a white wedge that wipes in from the left.
export default function Menu() {
  const { go, busy } = useTransitionNav()
  const revealed = useRevealed()
  const [selected, setSelected] = useState(0)
  const selectedRef = useRef(0)
  selectedRef.current = selected
  const linkRefs = useRef([])

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
        setSelected(n)
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
          const pose = POSES[i % POSES.length]
          return (
            <motion.li
              key={item.id}
              className="menu__item"
              style={{ '--i': i, '--r': `${pose.r}deg`, '--ry': `${pose.ry}deg`, '--x': `${pose.x}em` }}
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate={revealed ? 'shown' : 'hidden'}
            >
              <div className="menu__bob">
                <a
                  ref={(el) => (linkRefs.current[i] = el)}
                  href={hrefFor(item)}
                  className={`menu__link ${isSel ? 'is-selected' : ''}`}
                  aria-current={isSel ? 'true' : undefined}
                  {...(external
                    ? { target: '_blank', rel: 'noopener noreferrer', 'aria-label': `${item.label} (opens in a new tab)` }
                    : {})}
                  onMouseEnter={() => setSelected(i)}
                  onFocus={() => setSelected(i)}
                  onClick={(e) => {
                    setSelected(i)
                    if (external && !busy) return // let the browser open the new tab
                    e.preventDefault()
                    activate(item)
                  }}
                >
                  <motion.span
                    className="menu__scale"
                    initial={false}
                    animate={{ scale: isSel ? 1 : 0.84 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                  >
                    {isSel && (
                      <motion.span
                        className="blade"
                        aria-hidden="true"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.16, ease: [0.2, 0.9, 0.3, 1] }}
                      >
                        <span className="blade__red" />
                        <span className="blade__white" />
                      </motion.span>
                    )}
                    <span className="menu__text">{item.label}</span>
                  </motion.span>
                </a>
              </div>
            </motion.li>
          )
        })}
      </ul>
    </nav>
  )
}
