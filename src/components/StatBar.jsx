// Stat row: label, 10 slanted segments that fill one by one, big rank number.
export default function StatBar({ label, value, index = 0 }) {
  const v = Math.max(0, Math.min(10, Math.round(value)))
  return (
    <li className="stat">
      <span className="stat__label">{label}</span>
      <span
        className="stat__bar"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={v}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="stat__seg">
            {i < v && (
              <span className="stat__fill" style={{ animationDelay: `${index * 60 + i * 40}ms` }} />
            )}
          </span>
        ))}
      </span>
      <span className="stat__rank" aria-hidden="true">
        {v}
      </span>
    </li>
  )
}
