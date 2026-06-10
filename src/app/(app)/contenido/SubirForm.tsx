'use client'

import { useActionState } from 'react'
import { subirContenido, type SubirState } from './actions'

const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400'

export function SubirForm({
  clientes,
  defaultFecha,
}: {
  clientes: { id: string; nombre: string }[]
  defaultFecha: string
}) {
  const [state, action, pending] = useActionState<SubirState, FormData>(subirContenido, null)

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
        <label className="mb-1 block text-sm font-medium text-gray-700">Archivos (fotos / videos)</label>
        <input
          type="file"
          name="archivos"
          multiple
          accept="image/*,video/*"
          required
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        />
        <p className="mt-1 text-xs text-gray-400">Puedes seleccionar varios. Hasta 50 MB por archivo.</p>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? 'Subiendo…' : 'Subir contenido'}
      </button>
    </form>
  )
}
