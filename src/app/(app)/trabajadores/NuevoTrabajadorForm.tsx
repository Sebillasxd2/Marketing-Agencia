'use client'

import { useActionState } from 'react'
import { crearTrabajador, type TrabajadorState } from './actions'

const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400'

export function NuevoTrabajadorForm() {
  const [state, action, pending] = useActionState<TrabajadorState, FormData>(crearTrabajador, null)

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
        <input name="nombre" required className={input} placeholder="Carla Mendoza" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Correo</label>
        <input name="email" type="email" required className={input} placeholder="carla@agencia.com" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña inicial</label>
        <input name="password" type="text" required minLength={6} className={input} placeholder="mínimo 6 caracteres" />
        <p className="mt-1 text-xs text-gray-400">Compártesela; con esto entra a la plataforma.</p>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? 'Creando…' : 'Crear trabajador'}
      </button>
    </form>
  )
}
