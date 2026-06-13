'use client'

import { useActionState } from 'react'
import { importarDeDrive, type ImportState } from './actions'

const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400'

export function ImportarForm({
  clientes,
  archivos,
  defaultFecha,
}: {
  clientes: { id: string; nombre: string }[]
  archivos: { id: string; name: string; mimeType: string }[]
  defaultFecha: string
}) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importarDeDrive, null)

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Organización</label>
        <select name="clienteId" required defaultValue="" className={input}>
          <option value="" disabled>
            Elige una…
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Fecha de producción</label>
          <input type="date" name="fechaProduccion" defaultValue={defaultFecha} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Producción para</label>
          <input name="produccionPara" className={input} placeholder="Día de la Madre" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Archivos de tu Drive</label>
        {archivos.length === 0 ? (
          <p className="text-sm text-gray-400">No se encontraron fotos ni videos en tu Drive.</p>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
            {archivos.map((f) => (
              <li key={f.id}>
                <label className="flex items-center gap-2 rounded px-2 py-1 text-sm transition hover:bg-gray-50">
                  <input type="checkbox" name="file" value={f.id} className="accent-indigo-600" />
                  <span className="truncate">{f.name}</span>
                  <span className="ml-auto shrink-0 text-xs text-gray-400">{f.mimeType.startsWith('video') ? 'video' : 'imagen'}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? 'Importando…' : 'Importar seleccionados'}
      </button>
    </form>
  )
}
