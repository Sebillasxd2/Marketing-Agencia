'use client'

import { useState } from 'react'
import { aprobarPiezaCliente, pedirCambiosCliente } from './actions'

export function AprobarForm({ token, piezaId }: { token: string; piezaId: string }) {
  const [modo, setModo] = useState<'none' | 'cambios'>('none')

  return (
    <div className="space-y-2">
      <form action={aprobarPiezaCliente}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="piezaId" value={piezaId} />
        <button className="w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700">
          ✓ Aprobar
        </button>
      </form>

      {modo === 'none' ? (
        <button
          onClick={() => setModo('cambios')}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
        >
          Pedir cambios
        </button>
      ) : (
        <form action={pedirCambiosCliente} className="space-y-2">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="piezaId" value={piezaId} />
          <textarea
            name="comentario"
            required
            rows={2}
            placeholder="¿Qué te gustaría cambiar?"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
          />
          <div className="flex gap-2">
            <button className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-600">
              Enviar cambios
            </button>
            <button
              type="button"
              onClick={() => setModo('none')}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
