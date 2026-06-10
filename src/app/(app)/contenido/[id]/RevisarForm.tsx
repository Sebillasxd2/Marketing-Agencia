'use client'

import { useActionState, useRef, type MouseEvent } from 'react'
import { revisarContenido, type RevisionState } from '../actions'

export function RevisarForm({ piezaId, version }: { piezaId: string; version: number }) {
  const [state, action, pending] = useActionState<RevisionState, FormData>(revisarContenido, null)
  const colorRef = useRef<HTMLInputElement>(null)
  const comentRef = useRef<HTMLTextAreaElement>(null)

  function elegir(color: 'verde' | 'amarillo' | 'rojo', e: MouseEvent<HTMLButtonElement>) {
    if ((color === 'amarillo' || color === 'rojo') && !comentRef.current?.value.trim()) {
      e.preventDefault()
      alert('Escribe qué ajustar o por qué no va.')
      return
    }
    if (colorRef.current) colorRef.current.value = color
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="piezaId" value={piezaId} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="color" ref={colorRef} />
      <textarea
        ref={comentRef}
        name="comentario"
        rows={2}
        placeholder="Comentario (obligatorio para amarillo y rojo)…"
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          onClick={(e) => elegir('verde', e)}
          className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          🟢 Aprobar
        </button>
        <button
          type="submit"
          disabled={pending}
          onClick={(e) => elegir('amarillo', e)}
          className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-60"
        >
          🟡 Ajustes
        </button>
        <button
          type="submit"
          disabled={pending}
          onClick={(e) => elegir('rojo', e)}
          className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          🔴 No va
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">✓ Revisión guardada</p>}
    </form>
  )
}
