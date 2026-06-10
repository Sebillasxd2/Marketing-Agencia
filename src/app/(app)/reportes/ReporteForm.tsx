'use client'

import type { ReactNode } from 'react'
import { useActionState } from 'react'
import { guardarReporte, type ReporteState } from './actions'

export function ReporteForm({
  inicial,
}: {
  inicial: { queHice: string; bloqueos: string; planManana: string; enviado: boolean }
}) {
  const [state, action, pending] = useActionState<ReporteState, FormData>(guardarReporte, null)

  return (
    <form action={action} className="space-y-4">
      <Campo label="¿Qué hiciste hoy?" requerido>
        <textarea
          name="queHice"
          required
          defaultValue={inicial.queHice}
          rows={4}
          placeholder="Avances, piezas que trabajaste, lo que entregaste…"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
        />
      </Campo>
      <Campo label="¿Algo te frenó? (opcional)">
        <textarea
          name="bloqueos"
          defaultValue={inicial.bloqueos}
          rows={2}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
        />
      </Campo>
      <Campo label="Plan para mañana (opcional)">
        <textarea
          name="planManana"
          defaultValue={inicial.planManana}
          rows={2}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
        />
      </Campo>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">✓ Reporte guardado</p>}

      <button
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? 'Guardando…' : inicial.enviado ? 'Actualizar reporte' : 'Enviar reporte'}
      </button>
    </form>
  )
}

function Campo({ label, requerido, children }: { label: string; requerido?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {requerido && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
