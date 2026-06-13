'use client'

import { marcarPublicada } from '../actions'

export function PublicarForm({ piezaId }: { piezaId: string }) {
  return (
    <form action={marcarPublicada} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="piezaId" value={piezaId} />
      <input
        name="enlace"
        placeholder="Enlace de la publicación (opcional)"
        className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
      />
      <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800">
        Marcar como publicada
      </button>
    </form>
  )
}
