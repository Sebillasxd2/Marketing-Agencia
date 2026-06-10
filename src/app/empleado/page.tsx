import { and, eq } from 'drizzle-orm'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { piezas } from '@/db/schema'
import { Header } from '@/components/Header'
import { estadoMeta, tipoLabel } from '@/lib/estados'

export default async function EmpleadoPage() {
  const u = await requireUsuario('empleado')

  const mias = await db
    .select()
    .from(piezas)
    .where(and(eq(piezas.agenciaId, u.agenciaId), eq(piezas.creadaPor, u.id)))

  // Las que necesitan ajustes (amarillo) primero.
  const ordenadas = [...mias].sort(
    (a, b) => Number(b.estado === 'amarillo') - Number(a.estado === 'amarillo'),
  )

  return (
    <div>
      <Header nombre={u.nombre} rol="Empleado" />
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis piezas</h1>
          <p className="mt-1 text-sm text-gray-500">El contenido que subiste y su estado.</p>
        </div>

        {mias.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-400">
            Aún no tienes piezas. (Crear pieza llega en el próximo hito.)
          </p>
        ) : (
          <ul className="space-y-3">
            {ordenadas.map((p) => {
              const m = estadoMeta[p.estado]
              return (
                <li
                  key={p.id}
                  className={`rounded-2xl border bg-white px-5 py-4 ${
                    p.estado === 'amarillo' ? 'border-amber-300' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{tipoLabel[p.tipo]}</span>
                    <span className="text-sm font-medium">{p.titulo}</span>
                    <span
                      className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${m.clase}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${m.punto}`} />
                      {m.label}
                    </span>
                  </div>
                  {p.estado === 'amarillo' && (
                    <p className="mt-2 text-xs text-amber-700">⚠ Necesita tu atención — la jefa pidió ajustes.</p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
