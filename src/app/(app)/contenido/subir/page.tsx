import Link from 'next/link'
import { and, eq } from 'drizzle-orm'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { clientes, asignacionesCliente } from '@/db/schema'
import { hoyISO } from '@/lib/fecha'
import { SubirForm } from '../SubirForm'

export default async function SubirContenidoPage() {
  const u = await requireUsuario()

  const lista =
    u.rol === 'jefa'
      ? await db.select({ id: clientes.id, nombre: clientes.nombre }).from(clientes).where(eq(clientes.agenciaId, u.agenciaId))
      : await db
          .select({ id: clientes.id, nombre: clientes.nombre })
          .from(asignacionesCliente)
          .innerJoin(clientes, eq(clientes.id, asignacionesCliente.clienteId))
          .where(and(eq(asignacionesCliente.agenciaId, u.agenciaId), eq(asignacionesCliente.empleadoId, u.id)))

  return (
    <div className="max-w-xl space-y-6">
      <Link href="/contenido" className="text-sm text-gray-500 transition hover:text-gray-700">
        ← Volver a contenido
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subir contenido</h1>
        <p className="mt-1 text-sm text-gray-500">Catalógalo por organización, fecha y campaña.</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        {lista.length === 0 ? (
          <p className="text-sm text-gray-400">
            {u.rol === 'jefa' ? 'Crea un contrato primero en la sección Contratos.' : 'No tienes organizaciones asignadas todavía.'}
          </p>
        ) : (
          <SubirForm clientes={lista} defaultFecha={hoyISO()} />
        )}
      </div>
    </div>
  )
}
