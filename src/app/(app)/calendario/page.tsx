import Link from 'next/link'
import { and, eq } from 'drizzle-orm'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { publicaciones, clientes, asignacionesCliente } from '@/db/schema'
import { hoyISO } from '@/lib/fecha'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const estadoPub: Record<string, { label: string; dot: string }> = {
  idea: { label: 'Idea', dot: 'bg-gray-400' },
  produccion: { label: 'Producción', dot: 'bg-blue-500' },
  aprobado: { label: 'Aprobado', dot: 'bg-green-500' },
  publicado: { label: 'Publicado', dot: 'bg-indigo-500' },
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; cliente?: string }>
}) {
  const u = await requireUsuario()
  const sp = await searchParams

  const ahora = new Date()
  let year = ahora.getFullYear()
  let month0 = ahora.getMonth()
  if (sp.mes && /^\d{4}-\d{2}$/.test(sp.mes)) {
    const [y, m] = sp.mes.split('-').map(Number)
    year = y
    month0 = m - 1
  }
  const mesStr = `${year}-${String(month0 + 1).padStart(2, '0')}`
  const hoy = hoyISO()

  const clientesDisp =
    u.rol === 'jefa'
      ? await db.select({ id: clientes.id, nombre: clientes.nombre }).from(clientes).where(eq(clientes.agenciaId, u.agenciaId))
      : await db
          .select({ id: clientes.id, nombre: clientes.nombre })
          .from(asignacionesCliente)
          .innerJoin(clientes, eq(clientes.id, asignacionesCliente.clienteId))
          .where(and(eq(asignacionesCliente.agenciaId, u.agenciaId), eq(asignacionesCliente.empleadoId, u.id)))
  const idsDisp = new Set(clientesDisp.map((c) => c.id))
  const filtroCliente = sp.cliente && idsDisp.has(sp.cliente) ? sp.cliente : null

  const todas = await db
    .select({ id: publicaciones.id, fecha: publicaciones.fecha, titulo: publicaciones.titulo, estado: publicaciones.estado, clienteId: publicaciones.clienteId })
    .from(publicaciones)
    .where(eq(publicaciones.agenciaId, u.agenciaId))

  const pubs = todas.filter(
    (p) => p.fecha.startsWith(mesStr) && idsDisp.has(p.clienteId) && (!filtroCliente || p.clienteId === filtroCliente),
  )
  const porDia = new Map<string, typeof pubs>()
  for (const p of pubs) {
    const arr = porDia.get(p.fecha) ?? []
    arr.push(p)
    porDia.set(p.fecha, arr)
  }

  // Cuadrícula (semana inicia lunes)
  const primer = new Date(year, month0, 1)
  const offset = (primer.getDay() + 6) % 7
  const diasEnMes = new Date(year, month0 + 1, 0).getDate()
  const celdas: (string | null)[] = []
  for (let i = 0; i < offset; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(`${mesStr}-${String(d).padStart(2, '0')}`)
  while (celdas.length % 7 !== 0) celdas.push(null)

  const mesDe = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const link = (mes: string) => `/calendario?mes=${mes}${filtroCliente ? `&cliente=${filtroCliente}` : ''}`
  const prevMes = mesDe(new Date(year, month0 - 1, 1))
  const nextMes = mesDe(new Date(year, month0 + 1, 1))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendario</h1>
          <p className="mt-1 text-sm text-gray-500">Planea qué se publica y cuándo, por cliente.</p>
        </div>
        <Link
          href={`/calendario/nueva${filtroCliente ? `?cliente=${filtroCliente}` : ''}`}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={16} /> Nueva publicación
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Link href={link(prevMes)} className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50">
            <ChevronLeft size={16} />
          </Link>
          <Link href={link(nextMes)} className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50">
            <ChevronRight size={16} />
          </Link>
        </div>
        <h2 className="text-lg font-medium">
          {MESES[month0]} {year}
        </h2>

        <form method="get" className="ml-auto flex items-center gap-2">
          <input type="hidden" name="mes" value={mesStr} />
          <select
            name="cliente"
            defaultValue={filtroCliente ?? ''}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-gray-400"
          >
            <option value="">Todos los clientes</option>
            {clientesDisp.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50">
            Filtrar
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 text-center text-xs font-medium text-gray-500">
          {DIAS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {celdas.map((dia, i) => {
            const items = dia ? porDia.get(dia) ?? [] : []
            const esHoy = dia === hoy
            return (
              <div
                key={i}
                className={`group min-h-[104px] border-b border-r border-gray-100 p-1.5 ${!dia ? 'bg-gray-50' : esHoy ? 'bg-brand-soft' : ''}`}
              >
                {dia && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${esHoy ? 'text-brand font-semibold' : 'text-gray-400'}`}>{Number(dia.slice(-2))}</span>
                      <Link
                        href={`/calendario/nueva?fecha=${dia}${filtroCliente ? `&cliente=${filtroCliente}` : ''}`}
                        className="text-brand opacity-0 transition group-hover:opacity-100"
                        aria-label="Agregar"
                      >
                        <Plus size={14} />
                      </Link>
                    </div>
                    <div className="mt-1 space-y-1">
                      {items.slice(0, 3).map((p) => {
                        const m = estadoPub[p.estado]
                        return (
                          <Link
                            key={p.id}
                            href={`/calendario/${p.id}`}
                            className="flex items-center gap-1.5 rounded bg-gray-100 px-1.5 py-1 text-[11px] transition hover:bg-gray-200"
                          >
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${m.dot}`} />
                            <span className="truncate">{p.titulo}</span>
                          </Link>
                        )
                      })}
                      {items.length > 3 && <div className="text-[10px] text-gray-400">+{items.length - 3} más</div>}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        {Object.values(estadoPub).map((m) => (
          <span key={m.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${m.dot}`} />
            {m.label}
          </span>
        ))}
      </div>
    </div>
  )
}
