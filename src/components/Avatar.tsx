const COLORS = ['#4f46e5', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0d9488', '#dc2626', '#2563eb']

export function Avatar({ nombre, size = 32 }: { nombre: string; size?: number }) {
  const iniciales =
    nombre
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'

  let h = 0
  for (const ch of nombre) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const color = COLORS[h % COLORS.length]

  return (
    <span
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.4 }}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
    >
      {iniciales}
    </span>
  )
}
