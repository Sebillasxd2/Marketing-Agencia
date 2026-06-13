'use client'

import { useActionState } from 'react'
import { enviarARevision, type EnvioState } from '../actions'

export function ChecklistGate({ piezaId, items }: { piezaId: string; items: { texto: string; obligatorio: boolean }[] }) {
  const [state, action, pending] = useActionState<EnvioState, FormData>(enviarARevision, null)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="piezaId" value={piezaId} />
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">Sin checklist para este tipo. Puedes enviar directo.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <input id={`c${i}`} type="checkbox" name="check" value={i} className="mt-0.5 accent-indigo-600" />
              <label htmlFor={`c${i}`}>
                {it.texto}
                {it.obligatorio && <span className="text-red-500"> *</span>}
              </label>
            </li>
          ))}
        </ul>
      )}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? 'Enviando…' : 'Enviar a revisión'}
      </button>
    </form>
  )
}
