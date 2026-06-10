'use client'

import { useActionState } from 'react'
import { crearCuenta, type CuentaState } from './actions'

const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400'

export function NuevaCuentaForm({ clientes }: { clientes: { id: string; nombre: string }[] }) {
  const [state, action, pending] = useActionState<CuentaState, FormData>(crearCuenta, null)

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
          <label className="mb-1 block text-sm font-medium text-gray-700">Plataforma</label>
          <select name="plataforma" defaultValue="instagram" className={input}>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Usuario / @handle</label>
          <input name="usuario" required className={input} placeholder="@elpatio.sucre" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Enlace (opcional)</label>
        <input name="url" className={input} placeholder="https://instagram.com/…" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Notas (opcional)</label>
        <textarea name="notas" rows={2} className={input} placeholder="Acceso, contraseña compartida por otro medio, etc." />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? 'Guardando…' : 'Crear cuenta'}
      </button>
    </form>
  )
}
