export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const relativeTimeFormatter = new Intl.RelativeTimeFormat('ro', { numeric: 'always' })

export const fmtRelativeTime = (iso, now = Date.now()) => {
  const elapsedSeconds = (new Date(iso).getTime() - now) / 1000
  if (!Number.isFinite(elapsedSeconds)) return ''
  if (Math.abs(elapsedSeconds) < 60) return 'acum'

  const units = [
    ['minute', 60, 60 * 60],
    ['hour', 60 * 60, 24 * 60 * 60],
    ['day', 24 * 60 * 60, 30 * 24 * 60 * 60],
    ['month', 30 * 24 * 60 * 60, 365 * 24 * 60 * 60],
    ['year', 365 * 24 * 60 * 60, Infinity],
  ]
  const [unit, secondsPerUnit] = units.find(([, , upperBound]) => Math.abs(elapsedSeconds) < upperBound) || units.at(-1)

  return relativeTimeFormatter.format(Math.round(elapsedSeconds / secondsPerUnit), unit)
}
