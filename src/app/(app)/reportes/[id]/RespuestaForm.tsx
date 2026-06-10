'use client'

import { useActionState } from 'react'
import { responderReporte, type RespuestaState } from '../actions'

export function RespuestaForm({ id, inicial }: { id: string; inicial: string }) {
  const [state, action, pending] = useActionState<RespuestaState, FormData>(responderReporte, null)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <textarea
        name="respuesta"
        defaultValue={inicial}
        rows={3}
        placeholder="Escribe una respuesta para el equipo (opcional)…"
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
      />
      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
        >
          {pending ? 'Guardando…' : 'Responder'}
        </button>
        {state?.ok && <span className="text-sm text-green-600">✓ Guardado</span>}
      </div>
    </form>
  )
}
