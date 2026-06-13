'use client'

import { useActionState } from 'react'
import { subirCorreccion, type SubirState } from '../actions'

export function CorreccionForm({ piezaId }: { piezaId: string }) {
  const [state, action, pending] = useActionState<SubirState, FormData>(subirCorreccion, null)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="piezaId" value={piezaId} />
      <input
        type="file"
        name="archivo"
        accept="image/*,video/*"
        required
        className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? 'Subiendo…' : 'Subir corrección (nueva versión)'}
      </button>
    </form>
  )
}
