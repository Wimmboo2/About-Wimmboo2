// Circled key glyph + italic label, like the game's bottom-right prompts.
// Pass onClick to make it tappable (handy on touch screens with no keyboard).
export function KeyHint({ keys, label, onClick, ariaLabel }) {
  const content = (
    <>
      {keys.map((k) => (
        <span key={k} className={`keyhint__key ${k.length > 2 ? 'keyhint__key--wide' : ''}`}>
          {k}
        </span>
      ))}
      <span className="keyhint__label">{label}</span>
    </>
  )
  return onClick ? (
    <button type="button" className="keyhint" onClick={onClick} aria-label={ariaLabel || label}>
      {content}
    </button>
  ) : (
    <span className="keyhint">{content}</span>
  )
}

export function KeyHints({ children }) {
  return (
    <nav className="keyhints" aria-label="Keyboard controls">
      {children}
    </nav>
  )
}

export default KeyHint
