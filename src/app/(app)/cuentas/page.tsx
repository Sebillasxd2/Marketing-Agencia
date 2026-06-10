import Link from 'next/link'
import { and, eq } from 'drizzle-orm'
import { Plus } from 'lucide-react'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { cuentas, clientes, asignacionesCliente } from '@/db/schema'
import { EliminarCuenta } from './EliminarCuenta'

const plataformaMeta: Record<string, { label: string; clase: string }> = {
  facebook: { label: 'Facebook', clase: 'bg-blue-100 text-blue-700' },
  instagram: { label: 'Instagram', clase: 'bg-pink-100 text-pink-700' },
  tiktok: { label: 'TikTok', clase: 'bg-gray-900 text-white' },
  youtube: { label: 'YouTube', clase: 'bg-red-100 text-red-700' },
  otro: { label: 'Otro', clase: 'bg-gray-100 text-gray-600' },
}

const cols = {
  id: cuentas.id,
  plataforma: cuentas.plataforma,
  usuario: cuentas.usuario,
  url: cuentas.url,
  cliente: clientes.nombre,
}

export default async function CuentasPage() {
  const u = await requireUsuario()

  const lista =
    u.rol === 'jefa'
      ? await db.select(cols).from(cuentas).innerJoin(clientes, eq(clientes.id, cuentas.clienteId)).where(eq(cuentas.agenciaId, u.agenciaId))
      : await db
          .select(cols)
          .from(cuentas)
          .innerJoin(clientes, eq(clientes.id, cuentas.clienteId))
          .innerJoin(
            asignacionesCliente,
            and(eq(asignacionesCliente.clienteId, cuentas.clienteId), eq(asignacionesCliente.empleadoId, u.id)),
          )
          .where(eq(cuentas.agenciaId, u.agenciaId))

  const grupos = new Map<string, typeof lista>()
  for (const cu of lista) {
    if (!grupos.has(cu.cliente)) grupos.set(cu.cliente, [])
    grupos.get(cu.cliente)!.push(cu)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cuentas</h1>
          <p className="mt-1 text-sm text-gray-500">
            {u.rol === 'jefa' ? 'Las cuentas de redes de cada organización.' : 'Las cuentas de tus organizaciones asignadas.'}
          </p>
        </div>
        {u.rol === 'jefa' && (
          <Link
            href="/cuentas/nueva"
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Plus size={16} /> Nueva cuenta
          </Link>
        )}
      </div>

      {lista.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 px-5 py-12 text-center text-sm text-gray-400">
          No hay cuentas registradas todavía.
        </p>
      ) : (
        [...grupos.entries()].map(([cliente, cs]) => (
          <section key={cliente} className="space-y-2">
            <h2 className="font-medium">{cliente}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {cs.map((cu) => {
                const m = plataformaMeta[cu.plataforma] ?? plataformaMeta.otro
                return (
                  <li key={cu.id} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m.clase}`}>{m.label}</span>
                    <div className="min-w-0">
                      {cu.url ? (
                        <a href={cu.url} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline">
                          {cu.usuario}
                        </a>
                      ) : (
                        <span className="text-sm font-medium">{cu.usuario}</span>
                      )}
                    </div>
                    {u.rol === 'jefa' && (
                      <div className="ml-auto">
                        <EliminarCuenta id={cu.id} etiqueta={`${m.label} ${cu.usuario}`} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
