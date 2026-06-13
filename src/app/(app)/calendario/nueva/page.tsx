import Link from 'next/link'
import { and, eq } from 'drizzle-orm'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { clientes, asignacionesCliente, miembrosAgencia, perfiles } from '@/db/schema'
import { hoyISO } from '@/lib/fecha'
import { PublicacionForm } from '../PublicacionForm'

export default async function NuevaPublicacionPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; cliente?: string }>
}) {
  const u = await requireUsuario()
  const sp = await searchParams
  const fecha = sp.fecha && /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha) ? sp.fecha : hoyISO()

  const clientesDisp =
    u.rol === 'jefa'
      ? await db.select({ id: clientes.id, nombre: clientes.nombre }).from(clientes).where(eq(clientes.agenciaId, u.agenciaId))
      : await db
          .select({ id: clientes.id, nombre: clientes.nombre })
          .from(asignacionesCliente)
          .innerJoin(clientes, eq(clientes.id, asignacionesCliente.clienteId))
          .where(and(eq(asignacionesCliente.agenciaId, u.agenciaId), eq(asignacionesCliente.empleadoId, u.id)))

  const empleados =
    u.rol === 'jefa'
      ? await db
          .select({ id: perfiles.id, nombre: perfiles.nombreCompleto })
          .from(miembrosAgencia)
          .innerJoin(perfiles, eq(perfiles.id, miembrosAgencia.perfilId))
          .where(and(eq(miembrosAgencia.agenciaId, u.agenciaId), eq(miembrosAgencia.rol, 'empleado')))
      : []

  return (
    <div className="max-w-lg space-y-6">
      <Link href="/calendario" className="text-sm text-gray-500 transition hover:text-gray-700">
        ← Volver al calendario
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva publicación</h1>
        <p className="mt-1 text-sm text-gray-500">Planea una publicación para una fecha.</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        {clientesDisp.length === 0 ? (
          <p className="text-sm text-gray-400">No tienes organizaciones disponibles.</p>
        ) : (
          <PublicacionForm
            clientes={clientesDisp}
            empleados={empleados}
            esJefa={u.rol === 'jefa'}
            inicial={{ fecha, clienteId: sp.cliente }}
          />
        )}
      </div>
    </div>
  )
}
