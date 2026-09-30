import { motion } from 'framer-motion'

const spring = { type: 'spring', stiffness: 560, damping: 42 }

// Slanted tab strip. Selected tab = the /projects selected-row treatment.
export default function TabStrip({ tabs, selected, onSelect, idPrefix = 'tab' }) {
  return (
    <div className="tabs" role="tablist" aria-label="About sections">
      {tabs.map((t, i) => {
        const isSel = i === selected
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${idPrefix}-${t.id}`}
            aria-selected={isSel}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={isSel ? 0 : -1}
            className={`tab ${isSel ? 'is-selected' : ''}`}
            onClick={() => onSelect(i)}
          >
            <span className="tab__bg" aria-hidden="true" />
            {isSel && (
              <motion.span layoutId="tab-highlight" transition={spring} className="tab__hl" aria-hidden="true">
                <span className="tab__hl-inner">
                  <span className="tab__hl-white" />
                </span>
              </motion.span>
            )}
            <span className="tab__n" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="tab__label">{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
