'use client'

import type { ReactNode } from 'react'
import { useActionState } from 'react'
import { crearContrato, actualizarContrato, type ContratoState } from './actions'

type Inicial = {
  nombre?: string
  rubro?: string
  ciudad?: string
  contacto?: string
  telefono?: string
  email?: string
  inicioContrato?: string
  tarifaMensual?: string
  estadoContrato?: string
  notasMarca?: string
}

const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400'

export function ContratoForm({ inicial = {}, id }: { inicial?: Inicial; id?: string }) {
  const accion = id ? actualizarContrato : crearContrato
  const [state, action, pending] = useActionState<ContratoState, FormData>(accion, null)

  return (
    <form action={action} className="space-y-4">
      {id && <input type="hidden" name="id" value={id} />}

      <Campo label="Nombre del negocio" requerido>
        <input name="nombre" required defaultValue={inicial.nombre ?? ''} className={input} placeholder="El Patio de la Abuela" />
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Rubro">
          <input name="rubro" defaultValue={inicial.rubro ?? ''} className={input} placeholder="Restaurante" />
        </Campo>
        <Campo label="Ciudad">
          <input name="ciudad" defaultValue={inicial.ciudad ?? ''} className={input} placeholder="Sucre" />
        </Campo>
        <Campo label="Contacto">
          <input name="contacto" defaultValue={inicial.contacto ?? ''} className={input} placeholder="Don Roberto" />
        </Campo>
        <Campo label="Teléfono / WhatsApp">
          <input name="telefono" defaultValue={inicial.telefono ?? ''} className={input} placeholder="+591…" />
        </Campo>
        <Campo label="Correo del dueño">
          <input name="email" type="email" defaultValue={inicial.email ?? ''} className={input} placeholder="dueno@correo.com" />
        </Campo>
        <Campo label="Inicio de contrato">
          <input type="date" name="inicioContrato" defaultValue={inicial.inicioContrato ?? ''} className={input} />
        </Campo>
        <Campo label="Tarifa mensual (Bs)">
          <input type="number" step="0.01" name="tarifaMensual" defaultValue={inicial.tarifaMensual ?? ''} className={input} placeholder="1500" />
        </Campo>
      </div>

      <Campo label="Estado">
        <select name="estadoContrato" defaultValue={inicial.estadoContrato ?? 'activo'} className={input}>
          <option value="activo">Activo</option>
          <option value="pausado">Pausado</option>
          <option value="finalizado">Finalizado</option>
        </select>
      </Campo>

      <Campo label="Notas de marca">
        <textarea name="notasMarca" defaultValue={inicial.notasMarca ?? ''} rows={3} className={input} placeholder="Tono, restricciones, lo que NO se debe hacer…" />
      </Campo>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600">✓ Guardado</p>}

      <button
        disabled={pending}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
      >
        {pending ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear contrato'}
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
