// Small light-blue triangular tab for a row's top-left corner.
export default function NumberTab({ n, className = '' }) {
  return (
    <span className={`numtab ${className}`} aria-hidden="true">
      <span className="numtab__n">{n}</span>
    </span>
  )
}
