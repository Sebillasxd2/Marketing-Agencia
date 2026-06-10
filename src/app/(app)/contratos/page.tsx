import Link from 'next/link'
import { and, eq } from 'drizzle-orm'
import { Plus } from 'lucide-react'
import { requireUsuario, type UsuarioActual } from '@/lib/dal'
import { db } from '@/db'
import { clientes, asignacionesCliente } from '@/db/schema'

type ContratoRow = {
  id: string
  nombre: string
  rubro: string | null
  ciudad: string | null
  estadoContrato: 'activo' | 'pausado' | 'finalizado'
  tarifaMensual: string | null
}

const estadoMeta: Record<string, { label: string; clase: string }> = {
  activo: { label: 'Activo', clase: 'bg-green-100 text-green-700' },
  pausado: { label: 'Pausado', clase: 'bg-amber-100 text-amber-700' },
  finalizado: { label: 'Finalizado', clase: 'bg-gray-100 text-gray-600' },
}

const cols = {
  id: clientes.id,
  nombre: clientes.nombre,
  rubro: clientes.rubro,
  ciudad: clientes.ciudad,
  estadoContrato: clientes.estadoContrato,
  tarifaMensual: clientes.tarifaMensual,
}

export default async function ContratosPage() {
  const u = await requireUsuario()
  const contratos: ContratoRow[] =
    u.rol === 'jefa'
      ? await db.select(cols).from(clientes).where(eq(clientes.agenciaId, u.agenciaId))
      : await db
          .select(cols)
          .from(asignacionesCliente)
          .innerJoin(clientes, eq(clientes.id, asignacionesCliente.clienteId))
          .where(and(eq(asignacionesCliente.agenciaId, u.agenciaId), eq(asignacionesCliente.empleadoId, u.id)))

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contratos</h1>
          <p className="mt-1 text-sm text-gray-500">
            {u.rol === 'jefa' ? 'Las organizaciones con las que trabajas.' : 'Los contratos que tienes asignados.'}
          </p>
        </div>
        {u.rol === 'jefa' && (
          <Link
            href="/contratos/nuevo"
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Plus size={16} /> Nuevo contrato
          </Link>
        )}
      </div>

      {contratos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 px-5 py-12 text-center text-sm text-gray-400">
          {u.rol === 'jefa' ? 'Aún no tienes contratos. Crea el primero.' : 'No tienes contratos asignados.'}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {contratos.map((c) => {
            const m = estadoMeta[c.estadoContrato]
            return (
              <li key={c.id}>
                <Link
                  href={`/contratos/${c.id}`}
                  className="block rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <h2 className="font-medium">{c.nombre}</h2>
                    <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${m.clase}`}>{m.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {[c.rubro, c.ciudad].filter(Boolean).join(' · ') || 'Sin detalles'}
                  </p>
                  {c.tarifaMensual && <p className="mt-2 text-xs text-gray-400">Bs {c.tarifaMensual} / mes</p>}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
