/** Fecha de hoy en formato YYYY-MM-DD (hora local del servidor). */
export function hoyISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "2026-06-10" -> "10 jun 2026". */
export function formatoFecha(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MESES[(m ?? 1) - 1]} ${y}`
}
