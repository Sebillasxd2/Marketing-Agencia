'use client'

import { useActionState } from 'react'
import { crearPublicacion, actualizarPublicacion, type PubState } from './actions'

type Inicial = {
  clienteId?: string
  fecha?: string
  titulo?: string
  red?: string
  estado?: string
  notas?: string
  asignadoA?: string
}

const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400'

export function PublicacionForm({
  clientes,
  empleados,
  esJefa,
  inicial = {},
  id,
}: {
  clientes: { id: string; nombre: string }[]
  empleados: { id: string; nombre: string }[]
  esJefa: boolean
  inicial?: Inicial
  id?: string
}) {
  const accion = id ? actualizarPublicacion : crearPublicacion
  const [state, action, pending] = useActionState<PubState, FormData>(accion, null)

  return (
    <form action={action} className="space-y-4">
      {id && <input type="hidden" name="id" value={id} />}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Organización</label>
        <select name="clienteId" required defaultValue={inicial.clienteId ?? ''} className={input}>
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
          <label className="mb-1 block text-sm font-medium text-gray-700">Fecha</label>
          <input type="date" name="fecha" required defaultValue={inicial.fecha ?? ''} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Red</label>
          <select name="red" defaultValue={inicial.red ?? ''} className={input}>
            <option value="">—</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="otro">Otro</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Título</label>
        <input name="titulo" required defaultValue={inicial.titulo ?? ''} className={input} placeholder="Reel salteñas · Día de la Madre…" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
          <select name="estado" defaultValue={inicial.estado ?? 'idea'} className={input}>
            <option value="idea">Idea</option>
            <option value="produccion">Producción</option>
            <option value="aprobado">Aprobado</option>
            <option value="publicado">Publicado</option>
          </select>
        </div>
        {esJefa && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Asignar a</label>
            <select name="asignadoA" defaultValue={inicial.asignadoA ?? ''} className={input}>
              <option value="">Nadie</option>
              {empleados.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
        <textarea name="notas" rows={2} defaultValue={inicial.notas ?? ''} className={input} placeholder="Idea, copy, referencia…" />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear publicación'}
      </button>
    </form>
  )
}
