import Link from 'next/link'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { reportesDiarios, perfiles } from '@/db/schema'
import { formatoFecha } from '@/lib/fecha'
import { RespuestaForm } from './RespuestaForm'

export default async function ReporteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const u = await requireUsuario()

  const rows = await db
    .select({
      id: reportesDiarios.id,
      fecha: reportesDiarios.fecha,
      queHice: reportesDiarios.queHice,
      bloqueos: reportesDiarios.bloqueos,
      planManana: reportesDiarios.planManana,
      respuestaJefa: reportesDiarios.respuestaJefa,
      leido: reportesDiarios.leidoPorJefa,
      empleadoId: reportesDiarios.empleadoId,
      empleado: perfiles.nombreCompleto,
    })
    .from(reportesDiarios)
    .innerJoin(perfiles, eq(perfiles.id, reportesDiarios.empleadoId))
    .where(and(eq(reportesDiarios.id, id), eq(reportesDiarios.agenciaId, u.agenciaId)))
    .limit(1)

  const r = rows[0]
  if (!r) redirect('/reportes')
  if (u.rol === 'empleado' && r.empleadoId !== u.id) redirect('/reportes')

  if (u.rol === 'jefa' && !r.leido) {
    try {
      await db.update(reportesDiarios).set({ leidoPorJefa: true }).where(eq(reportesDiarios.id, r.id))
    } catch {}
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/reportes" className="text-sm text-gray-500 transition hover:text-gray-700">
        ← Volver a reportes
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{r.empleado}</h1>
        <p className="mt-1 text-sm text-gray-500">{formatoFecha(r.fecha)}</p>
      </div>

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <Campo titulo="Qué hizo hoy" texto={r.queHice} />
        {r.bloqueos && <Campo titulo="Bloqueos" texto={r.bloqueos} />}
        {r.planManana && <Campo titulo="Plan para mañana" texto={r.planManana} />}
      </section>

      {u.rol === 'jefa' ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-medium">Tu respuesta</h2>
          <RespuestaForm id={r.id} inicial={r.respuestaJefa ?? ''} />
        </section>
      ) : (
        r.respuestaJefa && (
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="mb-1 font-medium">Respuesta de la jefa</h2>
            <p className="text-sm text-gray-600">{r.respuestaJefa}</p>
          </section>
        )
      )}
    </div>
  )
}

function Campo({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-gray-400">{titulo}</div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{texto}</p>
    </div>
  )
}
