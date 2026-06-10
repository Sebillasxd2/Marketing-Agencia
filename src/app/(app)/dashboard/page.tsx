import { and, eq } from 'drizzle-orm'
import { requireUsuario, type UsuarioActual } from '@/lib/dal'
import { db } from '@/db'
import { piezas, miembrosAgencia, perfiles, reportesDiarios } from '@/db/schema'
import { estadoMeta, tipoLabel } from '@/lib/estados'

export default async function DashboardPage() {
  const u = await requireUsuario()
  return u.rol === 'jefa' ? <DashboardJefa u={u} /> : <DashboardEmpleado u={u} />
}

async function DashboardJefa({ u }: { u: UsuarioActual }) {
  const todas = await db.select().from(piezas).where(eq(piezas.agenciaId, u.agenciaId))
  const enRevision = todas.filter((p) => p.estado === 'en_revision')
  const cuenta = (e: string) => todas.filter((p) => p.estado === e).length
  const verdes = todas.filter((p) => p.estado === 'verde')
  const pctPrimer = verdes.length
    ? Math.round((verdes.filter((p) => p.versionActual === 1).length / verdes.length) * 100)
    : 0

  const empleados = await db
    .select({ id: perfiles.id, nombre: perfiles.nombreCompleto })
    .from(miembrosAgencia)
    .innerJoin(perfiles, eq(perfiles.id, miembrosAgencia.perfilId))
    .where(and(eq(miembrosAgencia.agenciaId, u.agenciaId), eq(miembrosAgencia.rol, 'empleado')))

  const reportesHoy = await db
    .select()
    .from(reportesDiarios)
    .where(and(eq(reportesDiarios.agenciaId, u.agenciaId), eq(reportesDiarios.fecha, '2026-06-10')))
  const reporto = new Set(reportesHoy.map((r) => r.empleadoId))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hola, {u.nombre.split(' ')[0]} 👋</h1>
        <p className="mt-1 text-sm text-gray-500">Esto es lo que necesita tu atención hoy.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Pendientes de revisar" valor={enRevision.length} acento="text-blue-600" />
        <Kpi label="Aprobadas" valor={cuenta('verde')} acento="text-green-600" />
        <Kpi label="En ajustes" valor={cuenta('amarillo')} acento="text-amber-600" />
        <Kpi label="Aprobado al 1er intento" valor={`${pctPrimer}%`} acento="text-gray-900" />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="font-medium">
            Cola de revisión <span className="text-gray-400">({enRevision.length})</span>
          </h2>
        </div>
        {enRevision.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400">Nada pendiente. Todo al día. ✨</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {enRevision.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{tipoLabel[p.tipo]}</span>
                <span className="text-sm">{p.titulo}</span>
                <span className="ml-auto text-xs text-gray-400">v{p.versionActual}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="font-medium">Reportes de hoy</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {empleados.map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <span>{e.nombre}</span>
              {reporto.has(e.id) ? (
                <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Reportó
                </span>
              ) : (
                <span className="ml-auto rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  Pendiente
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

async function DashboardEmpleado({ u }: { u: UsuarioActual }) {
  const mias = await db
    .select()
    .from(piezas)
    .where(and(eq(piezas.agenciaId, u.agenciaId), eq(piezas.creadaPor, u.id)))
  const amarillas = mias.filter((p) => p.estado === 'amarillo')
  const cuenta = (e: string) => mias.filter((p) => p.estado === e).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hola, {u.nombre.split(' ')[0]} 👋</h1>
        <p className="mt-1 text-sm text-gray-500">Tu resumen del día.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="En revisión" valor={cuenta('en_revision')} acento="text-blue-600" />
        <Kpi label="Aprobadas" valor={cuenta('verde')} acento="text-green-600" />
        <Kpi label="Necesitan ajustes" valor={amarillas.length} acento="text-amber-600" />
        <Kpi label="Borradores" valor={cuenta('borrador')} acento="text-gray-900" />
      </div>

      {amarillas.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
          <h2 className="font-medium text-amber-800">Necesitan tu atención</h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            {amarillas.map((p) => (
              <li key={p.id}>• {p.titulo}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Kpi({ label, valor, acento }: { label: string; valor: number | string; acento: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
      <div className={`text-2xl font-semibold ${acento}`}>{valor}</div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  )
}
