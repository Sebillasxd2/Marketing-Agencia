'use client'

import { eliminarPublicacion } from '../actions'

export function EliminarPublicacion({ id }: { id: string }) {
  return (
    <form
      action={eliminarPublicacion}
      onSubmit={(e) => {
        if (!confirm('¿Eliminar esta publicación del calendario?')) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="text-sm font-medium text-red-600 transition hover:text-red-700">Eliminar</button>
    </form>
  )
}
