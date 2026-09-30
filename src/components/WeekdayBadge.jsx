// Inverted-triangle weekday badge (MON, TUE, …).
export default function WeekdayBadge({ day, name, inverted = false }) {
  return (
    <span className={`weekday ${inverted ? 'weekday--inv' : ''}`} role="img" aria-label={name}>
      <span className="weekday__t" aria-hidden="true">
        {day}
      </span>
    </span>
  )
}
