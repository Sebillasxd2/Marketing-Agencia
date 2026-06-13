import Link from 'next/link'
import { and, desc, eq } from 'drizzle-orm'
import { requireUsuario, type UsuarioActual } from '@/lib/dal'
import { db } from '@/db'
import { reportesDiarios, perfiles, miembrosAgencia } from '@/db/schema'
import { hoyISO, formatoFecha } from '@/lib/fecha'
import { ReporteForm } from './ReporteForm'

export default async function ReportesPage() {
  const u = await requireUsuario()
  return u.rol === 'jefa' ? <VistaJefa u={u} /> : <VistaEmpleado u={u} />
}

async function VistaEmpleado({ u }: { u: UsuarioActual }) {
  const fecha = hoyISO()
  const todos = await db
    .select()
    .from(reportesDiarios)
    .where(and(eq(reportesDiarios.agenciaId, u.agenciaId), eq(reportesDiarios.empleadoId, u.id)))
    .orderBy(desc(reportesDiarios.fecha))
  const hoy = todos.find((r) => r.fecha === fecha)
  const historial = todos.filter((r) => r.fecha !== fecha)

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reporte diario</h1>
        <p className="mt-1 text-sm text-gray-500">{formatoFecha(fecha)}</p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-medium">Hoy</h2>
          {hoy && (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Enviado</span>
          )}
        </div>
        <ReporteForm
          inicial={{
            queHice: hoy?.queHice ?? '',
            bloqueos: hoy?.bloqueos ?? '',
            planManana: hoy?.planManana ?? '',
            enviado: !!hoy,
          }}
        />
        {hoy?.respuestaJefa && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
            <span className="font-medium text-gray-700">Respuesta de la jefa:</span>{' '}
            <span className="text-gray-600">{hoy.respuestaJefa}</span>
          </div>
        )}
      </section>

      {historial.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium">Anteriores</h2>
          <ul className="space-y-2">
            {historial.map((r) => (
              <li key={r.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs text-gray-400">{formatoFecha(r.fecha)}</div>
                <p className="mt-1 line-clamp-2 text-sm text-gray-700">{r.queHice}</p>
                {r.respuestaJefa && <p className="mt-1 text-xs text-gray-500">↳ Jefa: {r.respuestaJefa}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

async function VistaJefa({ u }: { u: UsuarioActual }) {
  const fecha = hoyISO()

  const [empleados, reportes] = await Promise.all([
    db
      .select({ id: perfiles.id, nombre: perfiles.nombreCompleto })
      .from(miembrosAgencia)
      .innerJoin(perfiles, eq(perfiles.id, miembrosAgencia.perfilId))
      .where(and(eq(miembrosAgencia.agenciaId, u.agenciaId), eq(miembrosAgencia.rol, 'empleado'))),
    db
      .select({
        id: reportesDiarios.id,
        fecha: reportesDiarios.fecha,
        queHice: reportesDiarios.queHice,
        leido: reportesDiarios.leidoPorJefa,
        empleadoId: reportesDiarios.empleadoId,
        empleado: perfiles.nombreCompleto,
      })
      .from(reportesDiarios)
      .innerJoin(perfiles, eq(perfiles.id, reportesDiarios.empleadoId))
      .where(eq(reportesDiarios.agenciaId, u.agenciaId))
      .orderBy(desc(reportesDiarios.fecha)),
  ])

  const reportoHoy = new Set(reportes.filter((r) => r.fecha === fecha).map((r) => r.empleadoId))

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
        <p className="mt-1 text-sm text-gray-500">Lo que tu equipo reportó · {formatoFecha(fecha)}</p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="font-medium">Estado de hoy</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {empleados.length === 0 ? (
            <li className="px-5 py-4 text-sm text-gray-400">Aún no tienes empleados.</li>
          ) : (
            empleados.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span>{e.nombre}</span>
                {reportoHoy.has(e.id) ? (
                  <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Reportó
                  </span>
                ) : (
                  <span className="ml-auto rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    Pendiente
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Todos los reportes</h2>
        {reportes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 px-5 py-8 text-center text-sm text-gray-400">
            Aún no hay reportes.
          </p>
        ) : (
          <ul className="space-y-2">
            {reportes.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/reportes/${r.id}`}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition hover:border-gray-300"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{r.empleado}</span>
                      <span className="text-xs text-gray-400">{formatoFecha(r.fecha)}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-sm text-gray-600">{r.queHice}</p>
                  </div>
                  {!r.leido && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" title="No leído" />}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
