import Link from 'next/link'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { clientes, asignacionesCliente, miembrosAgencia, perfiles } from '@/db/schema'
import { ContratoForm } from '../ContratoForm'
import { EliminarContrato } from './EliminarContrato'
import { asignarEmpleado, quitarEmpleado } from '../actions'

export default async function ContratoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const u = await requireUsuario()

  const rows = await db
    .select()
    .from(clientes)
    .where(and(eq(clientes.id, id), eq(clientes.agenciaId, u.agenciaId)))
    .limit(1)
  const c = rows[0]
  if (!c) redirect('/contratos')

  if (u.rol === 'empleado') {
    const asg = await db
      .select({ id: asignacionesCliente.id })
      .from(asignacionesCliente)
      .where(and(eq(asignacionesCliente.clienteId, id), eq(asignacionesCliente.empleadoId, u.id)))
      .limit(1)
    if (!asg[0]) redirect('/contratos')
  }

  let empleados: { id: string; nombre: string }[] = []
  let asignados = new Set<string>()
  if (u.rol === 'jefa') {
    empleados = await db
      .select({ id: perfiles.id, nombre: perfiles.nombreCompleto })
      .from(miembrosAgencia)
      .innerJoin(perfiles, eq(perfiles.id, miembrosAgencia.perfilId))
      .where(and(eq(miembrosAgencia.agenciaId, u.agenciaId), eq(miembrosAgencia.rol, 'empleado')))
    const asg = await db
      .select({ empleadoId: asignacionesCliente.empleadoId })
      .from(asignacionesCliente)
      .where(and(eq(asignacionesCliente.clienteId, id), eq(asignacionesCliente.agenciaId, u.agenciaId)))
    asignados = new Set(asg.map((a) => a.empleadoId))
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/contratos" className="text-sm text-gray-500 transition hover:text-gray-700">
        ← Volver a contratos
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">{c.nombre}</h1>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <ContratoForm
          id={c.id}
          inicial={{
            nombre: c.nombre,
            rubro: c.rubro ?? '',
            ciudad: c.ciudad ?? '',
            contacto: c.contacto ?? '',
            telefono: c.telefono ?? '',
            inicioContrato: c.inicioContrato ?? '',
            tarifaMensual: c.tarifaMensual ?? '',
            estadoContrato: c.estadoContrato,
            notasMarca: c.notasMarca ?? '',
          }}
        />
      </section>

      {u.rol === 'jefa' && (
        <>
          <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="font-medium">Empleados asignados</h2>
              <p className="mt-0.5 text-xs text-gray-500">Quién puede ver y trabajar este contrato.</p>
            </div>
            {empleados.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">
                Aún no tienes empleados. Créalos en la sección Trabajadores.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {empleados.map((e) => {
                  const yes = asignados.has(e.id)
                  return (
                    <li key={e.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                      <span>{e.nombre}</span>
                      <form action={yes ? quitarEmpleado : asignarEmpleado} className="ml-auto">
                        <input type="hidden" name="clienteId" value={c.id} />
                        <input type="hidden" name="empleadoId" value={e.id} />
                        <button
                          className={
                            yes
                              ? 'rounded-lg border border-gray-200 px-3 py-1 text-gray-600 transition hover:bg-gray-50'
                              : 'rounded-lg bg-gray-900 px-3 py-1 text-white transition hover:bg-gray-800'
                          }
                        >
                          {yes ? 'Quitar' : 'Asignar'}
                        </button>
                      </form>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <div className="flex justify-end border-t border-gray-200 pt-4">
            <EliminarContrato id={c.id} nombre={c.nombre} />
          </div>
        </>
      )}
    </div>
  )
}
