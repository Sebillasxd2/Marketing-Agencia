import Link from 'next/link'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { publicaciones, clientes, asignacionesCliente, miembrosAgencia, perfiles } from '@/db/schema'
import { PublicacionForm } from '../PublicacionForm'
import { EliminarPublicacion } from './EliminarPublicacion'

export default async function EditarPublicacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const u = await requireUsuario()

  const rows = await db
    .select()
    .from(publicaciones)
    .where(and(eq(publicaciones.id, id), eq(publicaciones.agenciaId, u.agenciaId)))
    .limit(1)
  const p = rows[0]
  if (!p) redirect('/calendario')

  if (u.rol === 'empleado') {
    const a = await db
      .select({ id: asignacionesCliente.id })
      .from(asignacionesCliente)
      .where(and(eq(asignacionesCliente.clienteId, p.clienteId), eq(asignacionesCliente.empleadoId, u.id)))
      .limit(1)
    if (!a[0]) redirect('/calendario')
  }

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
      <Link href={`/calendario?mes=${p.fecha.slice(0, 7)}`} className="text-sm text-gray-500 transition hover:text-gray-700">
        ← Volver al calendario
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Editar publicación</h1>
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <PublicacionForm
          clientes={clientesDisp}
          empleados={empleados}
          esJefa={u.rol === 'jefa'}
          id={p.id}
          inicial={{
            clienteId: p.clienteId,
            fecha: p.fecha,
            titulo: p.titulo,
            red: p.red ?? '',
            estado: p.estado,
            notas: p.notas ?? '',
            asignadoA: p.asignadoA ?? '',
          }}
        />
      </div>
      <div className="flex justify-end border-t border-gray-200 pt-4">
        <EliminarPublicacion id={p.id} />
      </div>
    </div>
  )
}
