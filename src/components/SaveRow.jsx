import { forwardRef, useRef } from 'react'
import { motion } from 'framer-motion'
import Moon from './Moon.jsx'
import NumberTab from './NumberTab.jsx'
import WeekdayBadge from './WeekdayBadge.jsx'

// hard-edged star + fork glyphs (16×16)
const STAR = 'M8 .8l2.2 4.8 5.2.6-3.9 3.5 1.1 5.1L8 12.2l-4.6 2.6 1.1-5.1L.6 6.2l5.2-.6z'
const FORK =
  'M4 1.5a2 2 0 0 1 1 3.73V6.5h6V5.23a2 2 0 1 1 2 0V8.5H9v2.27a2 2 0 1 1-2 0V8.5H3V5.23A2 2 0 0 1 4 1.5z'

const spring = { type: 'spring', stiffness: 520, damping: 42, mass: 0.9 }

// One P3R save slot. `slot` is the view model built in pages/Projects.jsx.
const SaveRow = forwardRef(function SaveRow({ slot, index, selected, onSelect }, ref) {
  const { date } = slot
  const hasBig = slot.bigNumber !== null && slot.bigNumber !== undefined && slot.bigNumber !== ''
  // selection state when the pointer went down: a tap on an unselected row
  // should only select it, even though focus selects it before `click` fires
  const wasSelected = useRef(null)
  return (
    <motion.li
      layout="position"
      transition={spring}
      className={`row ${selected ? 'is-selected' : ''}`}
    >
      <a
        ref={ref}
        className="row__hit"
        href={slot.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-current={selected ? 'true' : undefined}
        aria-label={`${slot.title}. ${slot.subtitle}. Last push ${date.weekdayName} ${date.month}/${date.day}, ${slot.timeOfDay}.${hasBig ? ` ${slot.bigNumber} ${(slot.bigNumberSpoken || '').toLowerCase()}.` : ''}${selected ? ` ${slot.description} ${slot.stars} stars, ${slot.forks} forks. Opens on GitHub in a new tab.` : ''}`}
        // hover-select only for a real mouse: on touch, the first tap selects
        onPointerEnter={(e) => e.pointerType === 'mouse' && onSelect()}
        onFocus={onSelect}
        onPointerDown={() => {
          wasSelected.current = selected
        }}
        onClick={(e) => {
          const was = wasSelected.current ?? selected
          wasSelected.current = null
          if (!was) {
            e.preventDefault()
            onSelect()
          }
        }}
      >
        <span className="row__bg" aria-hidden="true" />
        {selected && (
          <motion.span layoutId="row-highlight" transition={spring} className="row__hl" aria-hidden="true">
            <span className="row__hl-inner">
              <span className="row__hl-white" />
            </span>
          </motion.span>
        )}

        <NumberTab n={index + 1} className="row__tab" />

        <span className="row__left" aria-hidden="true">
          <span className="row__date">
            {date.month}/{date.day}
          </span>
          <span className="row__when">
            <WeekdayBadge day={date.weekday} name={date.weekdayName} inverted={selected} />
            <span className="row__tod">{slot.timeOfDay}</span>
          </span>
          <Moon phase={slot.moon} selected={selected} size={selected ? 34 : 28} />
        </span>

        <span className="row__right" aria-hidden="true">
          <span className="row__title">{slot.title}</span>
          <span className="row__sub">{slot.subtitle}</span>
          {selected && (
            <span className="row__detail">
              <span className="row__desc">{slot.description}</span>
              <span className="row__stats">
                <span className="row__stat">
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d={STAR} /></svg>
                  {slot.stars}
                </span>
                <span className="row__stat">
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d={FORK} /></svg>
                  {slot.forks}
                </span>
              </span>
            </span>
          )}
          {hasBig && (
            <span className="row__big">
              {selected && slot.bigNumberLabel && <span className="row__big-label">{slot.bigNumberLabel}</span>}
              <span className="row__big-n">{slot.bigNumber}</span>
            </span>
          )}
          {selected && <span className="row__tag">{slot.tag}</span>}
        </span>
      </a>
    </motion.li>
  )
})

export function SkeletonRow({ index }) {
  return (
    <li className="row row--skeleton" aria-hidden="true">
      <span className="row__hit">
        <span className="row__bg" />
        <NumberTab n={index + 1} className="row__tab" />
        <span className="row__left">
          <span className="skel skel--date" />
          <span className="skel skel--small" />
        </span>
        <span className="row__right">
          <span className="skel skel--title" />
          <span className="skel skel--big" />
        </span>
      </span>
    </li>
  )
}

export default SaveRow
