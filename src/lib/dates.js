// Date helpers for the save rows: M/D, weekday, time-of-day and moon phase.

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Month / day / weekday / hour of `iso`, in `timeZone` (or the visitor's local zone).
export function dateParts(iso, timeZone) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  let parts
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || undefined,
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      hourCycle: 'h23',
    })
    parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]))
  } catch {
    parts = null // bad timezone string: fall back to local time
  }
  const weekdayIdx = parts
    ? WEEKDAYS.indexOf(parts.weekday.slice(0, 3).toUpperCase())
    : d.getDay()
  return {
    month: parts ? Number(parts.month) : d.getMonth() + 1,
    day: parts ? Number(parts.day) : d.getDate(),
    hour: parts ? Number(parts.hour) % 24 : d.getHours(),
    weekday: WEEKDAYS[weekdayIdx],
    weekdayName: WEEKDAY_NAMES[weekdayIdx],
  }
}

export function timeOfDay(hour) {
  if (hour >= 5 && hour <= 10) return 'Morning'
  if (hour >= 11 && hour <= 14) return 'Daytime'
  if (hour >= 15 && hour <= 17) return 'After School'
  if (hour >= 18 && hour <= 21) return 'Evening'
  return 'Late Night'
}

// Synodic-month moon phase: 0 = new, 0.5 = full, back to 1 = new.
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)
const SYNODIC_DAYS = 29.530588853

export function moonPhase(iso) {
  const days = (new Date(iso).getTime() - REF_NEW_MOON) / 86400000
  const p = (days / SYNODIC_DAYS) % 1
  return p < 0 ? p + 1 : p
}

export function moonPhaseName(p) {
  if (p < 0.0339 || p > 0.9661) return 'New Moon'
  if (p < 0.2161) return 'Waxing Crescent'
  if (p < 0.2839) return 'First Quarter'
  if (p < 0.4661) return 'Waxing Gibbous'
  if (p < 0.5339) return 'Full Moon'
  if (p < 0.7161) return 'Waning Gibbous'
  if (p < 0.7839) return 'Last Quarter'
  return 'Waning Crescent'
}
