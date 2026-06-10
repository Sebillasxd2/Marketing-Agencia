'use client'

import { useActionState } from 'react'
import { actualizarNickname, type NicknameState } from './actions'

export function NicknameForm({ inicial }: { inicial: string }) {
  const [state, action, pending] = useActionState<NicknameState, FormData>(actualizarNickname, null)

  return (
    <form action={action} className="flex items-center gap-3">
      <input
        name="nombre"
        defaultValue={inicial}
        className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
      />
      <button
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? 'Guardando…' : 'Guardar'}
      </button>
      {state?.ok && <span className="text-sm text-green-600">✓ Guardado</span>}
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  )
}
