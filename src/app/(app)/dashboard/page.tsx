import Link from 'next/link'
import { and, asc, eq } from 'drizzle-orm'
import { Upload, FilePlus2, UserPlus, ClipboardList, type LucideIcon } from 'lucide-react'
import { requireUsuario, type UsuarioActual } from '@/lib/dal'
import { db } from '@/db'
import { piezas, miembrosAgencia, perfiles, reportesDiarios, clientes } from '@/db/schema'
import { tipoLabel } from '@/lib/estados'
import { hoyISO } from '@/lib/fecha'
import { Avatar } from '@/components/Avatar'

function saludoHora() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

export default async function DashboardPage() {
  const u = await requireUsuario()
  return u.rol === 'jefa' ? <DashboardJefa u={u} /> : <DashboardEmpleado u={u} />
}

async function DashboardJefa({ u }: { u: UsuarioActual }) {
  const todas = await db
    .select({ clienteId: piezas.clienteId, estado: piezas.estado, versionActual: piezas.versionActual })
    .from(piezas)
    .where(eq(piezas.agenciaId, u.agenciaId))

  const cuenta = (e: string) => todas.filter((p) => p.estado === e).length
  const verdes = todas.filter((p) => p.estado === 'verde')
  const pctPrimer = verdes.length ? Math.round((verdes.filter((p) => p.versionActual === 1).length / verdes.length) * 100) : 0

  const clientesList = await db
    .select({ id: clientes.id, nombre: clientes.nombre })
    .from(clientes)
    .where(eq(clientes.agenciaId, u.agenciaId))
  const salud = clientesList.map((c) => {
    const ps = todas.filter((p) => p.clienteId === c.id)
    return {
      ...c,
      enRevision: ps.filter((p) => p.estado === 'en_revision').length,
      amarillo: ps.filter((p) => p.estado === 'amarillo').length,
      verde: ps.filter((p) => p.estado === 'verde').length,
    }
  })

  const cola = await db
    .select({ id: piezas.id, titulo: piezas.titulo, tipo: piezas.tipo, versionActual: piezas.versionActual, cliente: clientes.nombre })
    .from(piezas)
    .innerJoin(clientes, eq(clientes.id, piezas.clienteId))
    .where(and(eq(piezas.agenciaId, u.agenciaId), eq(piezas.estado, 'en_revision')))
    .orderBy(asc(piezas.creadaEn))

  const empleados = await db
    .select({ id: perfiles.id, nombre: perfiles.nombreCompleto })
    .from(miembrosAgencia)
    .innerJoin(perfiles, eq(perfiles.id, miembrosAgencia.perfilId))
    .where(and(eq(miembrosAgencia.agenciaId, u.agenciaId), eq(miembrosAgencia.rol, 'empleado')))
  const reportesHoy = await db
    .select({ empleadoId: reportesDiarios.empleadoId })
    .from(reportesDiarios)
    .where(and(eq(reportesDiarios.agenciaId, u.agenciaId), eq(reportesDiarios.fecha, hoyISO())))
  const reporto = new Set(reportesHoy.map((r) => r.empleadoId))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {saludoHora()}, {u.nombre.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">Tu centro de mando. Esto es lo que pasa hoy.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AccionRapida href="/contenido/subir" label="Subir contenido" Icon={Upload} />
        <AccionRapida href="/contratos/nuevo" label="Nuevo contrato" Icon={FilePlus2} />
        <AccionRapida href="/trabajadores/nuevo" label="Nuevo trabajador" Icon={UserPlus} />
        <AccionRapida href="/reportes" label="Ver reportes" Icon={ClipboardList} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Pendientes de revisar" valor={cuenta('en_revision')} acento="text-brand" />
        <Kpi label="Aprobadas" valor={cuenta('verde')} acento="text-green-600" />
        <Kpi label="En ajustes" valor={cuenta('amarillo')} acento="text-amber-600" />
        <Kpi label="Aprobado al 1er intento" valor={`${pctPrimer}%`} acento="text-gray-900" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="font-medium">
              Cola de revisión <span className="text-gray-400">({cola.length})</span>
            </h2>
          </div>
          {cola.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">Nada pendiente. Todo al día ✨</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {cola.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link href={`/contenido/${p.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-gray-50">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{tipoLabel[p.tipo]}</span>
                    <span className="min-w-0 truncate text-sm">{p.titulo}</span>
                    <span className="ml-auto shrink-0 text-xs text-gray-400">{p.cliente}</span>
                  </Link>
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
            {empleados.length === 0 ? (
              <li className="px-5 py-6 text-sm text-gray-400">Aún no tienes empleados.</li>
            ) : (
              empleados.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <Avatar nombre={e.nombre} size={26} />
                  <span>{e.nombre}</span>
                  {reporto.has(e.id) ? (
                    <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Reportó</span>
                  ) : (
                    <span className="ml-auto rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Pendiente</span>
                  )}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section>
        <h2 className="mb-3 font-medium">Salud por cliente</h2>
        {salud.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 px-5 py-8 text-center text-sm text-gray-400">
            Aún no tienes contratos.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {salud.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/contratos/${c.id}`}
                  className="block rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm"
                >
                  <div className="text-sm font-medium">{c.nombre}</div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    <span className="text-brand">{c.enRevision} en revisión</span>
                    <span className="text-amber-600">{c.amarillo} ajustes</span>
                    <span className="text-green-600">{c.verde} ok</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

async function DashboardEmpleado({ u }: { u: UsuarioActual }) {
  const mias = await db
    .select({ id: piezas.id, titulo: piezas.titulo, estado: piezas.estado })
    .from(piezas)
    .where(and(eq(piezas.agenciaId, u.agenciaId), eq(piezas.creadaPor, u.id)))
  const amarillas = mias.filter((p) => p.estado === 'amarillo')
  const cuenta = (e: string) => mias.filter((p) => p.estado === e).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {saludoHora()}, {u.nombre.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">Tu resumen del día.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <AccionRapida href="/contenido/subir" label="Subir contenido" Icon={Upload} />
        <AccionRapida href="/reportes" label="Mi reporte" Icon={ClipboardList} />
        <AccionRapida href="/contenido" label="Mi contenido" Icon={FilePlus2} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="En revisión" valor={cuenta('en_revision')} acento="text-brand" />
        <Kpi label="Aprobadas" valor={cuenta('verde')} acento="text-green-600" />
        <Kpi label="Necesitan ajustes" valor={amarillas.length} acento="text-amber-600" />
        <Kpi label="Borradores" valor={cuenta('borrador')} acento="text-gray-900" />
      </div>

      {amarillas.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
          <h2 className="font-medium text-amber-800">Necesitan tu atención</h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            {amarillas.map((p) => (
              <li key={p.id}>
                <Link href={`/contenido/${p.id}`} className="hover:underline">
                  • {p.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function AccionRapida({ href, label, Icon }: { href: string; label: string; Icon: LucideIcon }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 transition hover:border-gray-300 hover:shadow-sm"
    >
      <span className="bg-brand-soft text-brand flex h-9 w-9 items-center justify-center rounded-lg">
        <Icon size={18} />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
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
