'use client'

import { eliminarCuenta } from './actions'

export function EliminarCuenta({ id, etiqueta }: { id: string; etiqueta: string }) {
  return (
    <form
      action={eliminarCuenta}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar la cuenta ${etiqueta}?`)) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="text-xs text-red-600 transition hover:text-red-700">Eliminar</button>
    </form>
  )
}
