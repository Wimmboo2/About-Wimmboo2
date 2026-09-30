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

// P3R pause-menu style list: red blade on the selected item, slides between items.
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
          return (
            <motion.li
              key={item.id}
              className="menu__item"
              style={{ '--i': i }}
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
                  {isSel && (
                    <motion.span
                      layoutId="menu-blade"
                      className="menu__blade"
                      transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                      aria-hidden="true"
                    >
                      <span className="menu__blade-shadow" />
                      <span className="menu__blade-red" />
                    </motion.span>
                  )}
                  <motion.span
                    className="menu__text"
                    animate={{ scale: isSel ? 1 : 0.78 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 34 }}
                  >
                    {item.label}
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
