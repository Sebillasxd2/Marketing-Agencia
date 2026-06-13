import { and, eq } from 'drizzle-orm'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { piezas, reportesDiarios, miembrosAgencia, perfiles } from '@/db/schema'

export default async function EstadisticasPage() {
  const u = await requireUsuario('jefa')

  const [empleados, todas, reportes] = await Promise.all([
    db
      .select({ id: perfiles.id, nombre: perfiles.nombreCompleto })
      .from(miembrosAgencia)
      .innerJoin(perfiles, eq(perfiles.id, miembrosAgencia.perfilId))
      .where(and(eq(miembrosAgencia.agenciaId, u.agenciaId), eq(miembrosAgencia.rol, 'empleado'))),
    db
      .select({ creadaPor: piezas.creadaPor, tipo: piezas.tipo, estado: piezas.estado, versionActual: piezas.versionActual })
      .from(piezas)
      .where(eq(piezas.agenciaId, u.agenciaId)),
    db
      .select({ empleadoId: reportesDiarios.empleadoId, fecha: reportesDiarios.fecha })
      .from(reportesDiarios)
      .where(eq(reportesDiarios.agenciaId, u.agenciaId)),
  ])

  // Últimos 7 días.
  const hoy = new Date()
  const dias: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(hoy)
    d.setDate(hoy.getDate() - i)
    dias.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  const diasSet = new Set(dias)

  const contenidoPorEmp: Record<string, number> = {}
  let totalContenido = 0
  for (const p of todas) {
    if (p.tipo === 'imagen' || p.tipo === 'video') {
      contenidoPorEmp[p.creadaPor] = (contenidoPorEmp[p.creadaPor] ?? 0) + 1
      totalContenido++
    }
  }

  const verdePorEmp: Record<string, { total: number; primer: number }> = {}
  for (const p of todas) {
    if (p.estado === 'verde') {
      const e = (verdePorEmp[p.creadaPor] ??= { total: 0, primer: 0 })
      e.total++
      if (p.versionActual === 1) e.primer++
    }
  }

  const reportesPorEmp: Record<string, Set<string>> = {}
  for (const r of reportes) {
    if (diasSet.has(r.fecha)) (reportesPorEmp[r.empleadoId] ??= new Set()).add(r.fecha)
  }
  const totalReportesSemana = Object.values(reportesPorEmp).reduce((s, set) => s + set.size, 0)

  const maxContenido = Math.max(1, ...empleados.map((e) => contenidoPorEmp[e.id] ?? 0))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Estadísticas</h1>
        <p className="mt-1 text-sm text-gray-500">Producción del equipo y cumplimiento de reportes.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Kpi label="Contenido producido" valor={totalContenido} />
        <Kpi label="Reportes (últimos 7 días)" valor={totalReportesSemana} />
        <Kpi label="Empleados" valor={empleados.length} />
      </div>

      <Panel titulo="Contenido por empleado">
        {empleados.length === 0 ? (
          <Vacio />
        ) : (
          empleados.map((e) => (
            <Barra key={e.id} label={e.nombre} valor={contenidoPorEmp[e.id] ?? 0} max={maxContenido} />
          ))
        )}
      </Panel>

      <Panel titulo="Aprobado al primer intento">
        {empleados.length === 0 ? (
          <Vacio />
        ) : (
          empleados.map((e) => {
            const v = verdePorEmp[e.id]
            const pct = v && v.total > 0 ? Math.round((v.primer / v.total) * 100) : 0
            return <Barra key={e.id} label={e.nombre} valor={pct} max={100} sufijo="%" />
          })
        )}
      </Panel>

      <Panel titulo="Reportes esta semana (de 7 días)">
        {empleados.length === 0 ? (
          <Vacio />
        ) : (
          empleados.map((e) => {
            const n = reportesPorEmp[e.id]?.size ?? 0
            return <Barra key={e.id} label={e.nombre} valor={n} max={7} sufijo=" / 7" />
          })
        )}
      </Panel>
    </div>
  )
}

function Kpi({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
      <div className="text-2xl font-semibold">{valor}</div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  )
}

function Panel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 font-medium">{titulo}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Barra({ label, valor, max, sufijo = '' }: { label: string; valor: number; max: number; sufijo?: string }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-gray-500">
          {valor}
          {sufijo}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-gray-900" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Vacio() {
  return <p className="text-sm text-gray-400">Aún no hay datos.</p>
}
