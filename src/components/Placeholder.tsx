export function Placeholder({
  titulo,
  descripcion,
  items,
}: {
  titulo: string
  descripcion: string
  items?: string[]
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        <p className="mt-1 text-sm text-gray-500">{descripcion}</p>
      </div>
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-gray-600">En construcción</p>
        <p className="mt-1 text-xs text-gray-400">Esta sección se construye en el siguiente hito.</p>
        {items && items.length > 0 && (
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-gray-500">
            {items.map((i) => (
              <li key={i} className="flex gap-2">
                <span className="text-gray-300">•</span>
                {i}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
