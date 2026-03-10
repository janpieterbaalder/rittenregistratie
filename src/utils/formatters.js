export function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateShort(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatMonthYear(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function getMonthRange(year, month) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return { start, end }
}
