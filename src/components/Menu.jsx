import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { githubMode, githubUsername, menuItems } from '../content.js'
import { useTransitionNav } from '../lib/transition.js'

const githubUrl = `https://github.com/${githubUsername}`

const itemVariants = {
  hidden: { x: 36, opacity: 0 },
  shown: (i) => ({
    x: 0,
    opacity: 1,
    transition: { delay: 0.08 + i * 0.08, duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  }),
}

// Cursor timing from Ultipuk's P3R pause-menu recreation (triangle_cursor.gd):
// it snaps to the new option in 0.06s (linear), then the front triangle
// "twitches" to 1.15x and back over 0.2s (see .menu__twitch in landing.css).
const snap = { type: 'tween', duration: 0.06, ease: 'linear' }

// P3R pause menu (look ported from blairxu13/persona3-website's P3Menu). One
// white triangle, with a pink one behind it, is always on screen and slides to
// whichever option is selected. The selected text turns red: bright inside the
// triangle, dark outside. Unselected options fade with distance.
export default function Menu() {
  const { go, busy } = useTransitionNav()
  const [selected, setSelected] = useState(0)
  const selectedRef = useRef(0)
  selectedRef.current = selected
  const listRef = useRef(null)
  const linkRefs = useRef([])
  const skewRefs = useRef([])
  const [boxes, setBoxes] = useState(null)

  const select = (i) => {
    if (i !== selectedRef.current) setSelected(i)
  }

  // Where each option's (unskewed) box sits inside the list, plus its triangle size.
  const measure = useCallback(() => {
    const list = listRef.current
    if (!list) return
    const lr = list.getBoundingClientRect()
    const next = menuItems.map((item, i) => {
      const link = linkRefs.current[i]
      const skew = skewRefs.current[i]
      if (!link || !skew) return null
      const r = link.getBoundingClientRect()
      const u = parseFloat(getComputedStyle(link).fontSize) / item.size // px per unit
      return {
        x: r.left - lr.left + skew.offsetLeft,
        y: r.top - lr.top + skew.offsetTop,
        w: skew.offsetWidth,
        h: skew.offsetHeight,
        triW: (item.label.length * item.size * 0.6 + 80) * u,
        triH: item.size * 0.94 * u,
        skew: item.skew,
        skewY: item.skewY,
      }
    })
    if (next.every(Boolean)) setBoxes(next)
  }, [])

  useLayoutEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

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
      <ul className="menu__list" ref={listRef}>
        {boxes && (
          <>
            <Cursor box={boxes[selected]} className="menu__cursor menu__cursor--pink" />
            <Cursor box={boxes[selected]} className="menu__cursor menu__cursor--white" twitchKey={selected} />
          </>
        )}
        {menuItems.map((item, i) => {
          const isSel = i === selected
          const external = isExternal(item)
          const dist = Math.abs(i - selected)
          // their triangle size: width = chars × size × 0.6 + 80, height = size × 0.94
          const w = item.label.length * item.size * 0.6 + 80
          const h = item.size * 0.94
          const px = (n) => `calc(${n} * var(--u))`
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
              animate="shown"
              onAnimationComplete={measure}
            >
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
                  ref={(el) => (skewRefs.current[i] = el)}
                  className="menu__skew"
                  style={{ transform: `skewX(${item.skew}deg) skewY(${item.skewY}deg)` }}
                >
                  <span className="menu__label" style={{ opacity: isSel ? 1 : Math.max(0.5, 1 - dist * 0.2) }}>
                    <span className="menu__text">{item.label}</span>
                    <span className="menu__text menu__text--bright" style={{ clipPath: clip }} aria-hidden="true">
                      {item.label}
                    </span>
                  </span>
                </span>
              </a>
            </motion.li>
          )
        })}
      </ul>
    </nav>
  )
}

// One triangle layer, placed and skewed exactly like the selected option's box.
function Cursor({ box, className, twitchKey }) {
  return (
    <motion.span
      className={className}
      aria-hidden="true"
      initial={{ x: box.x, y: box.y, width: box.w, height: box.h, skewX: box.skew, skewY: box.skewY, opacity: 0 }}
      animate={{
        x: box.x,
        y: box.y,
        width: box.w,
        height: box.h,
        skewX: box.skew,
        skewY: box.skewY,
        opacity: 1,
      }}
      transition={{ ...snap, opacity: { duration: 0.2, delay: 0.35 } }}
    >
      <motion.span
        className="menu__tri"
        initial={false}
        animate={{ width: box.triW, height: box.triH }}
        transition={snap}
      >
        {/* re-keyed on every selection so the twitch replays */}
        <span key={twitchKey} className="menu__twitch" />
      </motion.span>
    </motion.span>
  )
}
