'use client'

import { eliminarContrato } from '../actions'

export function EliminarContrato({ id, nombre }: { id: string; nombre: string }) {
  return (
    <form
      action={eliminarContrato}
      onSubmit={(e) => {
        if (
          !confirm(
            `¿Eliminar "${nombre}"?\n\nSe borrará el contrato y TODO su contenido (piezas, revisiones). Esta acción no se puede deshacer.`,
          )
        ) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="text-sm font-medium text-red-600 transition hover:text-red-700">Eliminar contrato</button>
    </form>
  )
}
