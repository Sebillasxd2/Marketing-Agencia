import Link from 'next/link'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Upload, CalendarPlus, AtSign, Pencil, ExternalLink, type LucideIcon } from 'lucide-react'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { clientes, cuentas, publicaciones, piezas, versionesPieza, asignacionesCliente } from '@/db/schema'
import { urlsFirmadas } from '@/lib/storage'
import { estadoMeta } from '@/lib/estados'
import { formatoFecha, hoyISO } from '@/lib/fecha'

const estadoContratoMeta: Record<string, { label: string; clase: string }> = {
  activo: { label: 'Activo', clase: 'bg-green-100 text-green-700' },
  pausado: { label: 'Pausado', clase: 'bg-amber-100 text-amber-700' },
  finalizado: { label: 'Finalizado', clase: 'bg-gray-100 text-gray-600' },
}
const estadoPubDot: Record<string, string> = {
  idea: 'bg-gray-400',
  produccion: 'bg-blue-500',
  aprobado: 'bg-green-500',
  publicado: 'bg-indigo-500',
}
const plataformaLabel: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  otro: 'Otro',
}

export default async function ClienteHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const u = await requireUsuario()
  const esEmpleado = u.rol === 'empleado'

  const [rows, cuentasList, pubsAll, contenido, asg] = await Promise.all([
    db.select().from(clientes).where(and(eq(clientes.id, id), eq(clientes.agenciaId, u.agenciaId))).limit(1),
    db
      .select({ id: cuentas.id, plataforma: cuentas.plataforma, usuario: cuentas.usuario, url: cuentas.url })
      .from(cuentas)
      .where(and(eq(cuentas.clienteId, id), eq(cuentas.agenciaId, u.agenciaId))),
    db
      .select({ id: publicaciones.id, fecha: publicaciones.fecha, titulo: publicaciones.titulo, estado: publicaciones.estado })
      .from(publicaciones)
      .where(and(eq(publicaciones.clienteId, id), eq(publicaciones.agenciaId, u.agenciaId)))
      .orderBy(asc(publicaciones.fecha)),
    db
      .select({ id: piezas.id, titulo: piezas.titulo, tipo: piezas.tipo, estado: piezas.estado, versionActual: piezas.versionActual })
      .from(piezas)
      .where(and(eq(piezas.clienteId, id), eq(piezas.agenciaId, u.agenciaId), inArray(piezas.tipo, ['imagen', 'video'])))
      .orderBy(desc(piezas.creadaEn))
      .limit(6),
    esEmpleado
      ? db
          .select({ id: asignacionesCliente.id })
          .from(asignacionesCliente)
          .where(and(eq(asignacionesCliente.clienteId, id), eq(asignacionesCliente.empleadoId, u.id)))
          .limit(1)
      : Promise.resolve([{ id: 'ok' }]),
  ])

  const c = rows[0]
  if (!c) redirect('/contratos')
  if (esEmpleado && !asg[0]) redirect('/contratos')

  const hoy = hoyISO()
  const proximas = pubsAll.filter((p) => p.fecha >= hoy).slice(0, 5)

  const ids = contenido.map((p) => p.id)
  const vers = ids.length
    ? await db
        .select({ piezaId: versionesPieza.piezaId, numeroVersion: versionesPieza.numeroVersion, miniaturaUrl: versionesPieza.miniaturaUrl })
        .from(versionesPieza)
        .where(inArray(versionesPieza.piezaId, ids))
    : []
  const miniMap: Record<string, string | null> = {}
  for (const it of contenido) {
    const v = vers.find((x) => x.piezaId === it.id && x.numeroVersion === it.versionActual) ?? vers.find((x) => x.piezaId === it.id)
    miniMap[it.id] = v?.miniaturaUrl ?? null
  }
  const firmadas = await urlsFirmadas(Object.values(miniMap).filter((p): p is string => !!p))

  const em = estadoContratoMeta[c.estadoContrato]

  return (
    <div className="space-y-6">
      <Link href="/contratos" className="text-sm text-gray-500 transition hover:text-gray-700">
        ← Volver a contratos
      </Link>

      <div className="flex flex-wrap items-start gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{c.nombre}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${em.clase}`}>{em.label}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {[c.rubro, c.ciudad].filter(Boolean).join(' · ') || 'Sin detalles'}
            {c.tarifaMensual ? ` · Bs ${c.tarifaMensual}/mes` : ''}
          </p>
        </div>
        <Link
          href={`/contratos/${c.id}/editar`}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
        >
          <Pencil size={15} /> Editar
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Accion href="/contenido/subir" label="Subir contenido" Icon={Upload} />
        <Accion href={`/calendario/nueva?cliente=${c.id}`} label="Nueva publicación" Icon={CalendarPlus} />
        <Accion href="/cuentas/nueva" label="Nueva cuenta" Icon={AtSign} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel titulo="Próximas publicaciones" verHref="/calendario">
          {proximas.length === 0 ? (
            <Vacio texto="Nada planeado próximamente." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {proximas.map((p) => (
                <li key={p.id}>
                  <Link href={`/calendario/${p.id}`} className="flex items-center gap-2 px-1 py-2 text-sm transition hover:bg-gray-50">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${estadoPubDot[p.estado]}`} />
                    <span className="truncate">{p.titulo}</span>
                    <span className="ml-auto shrink-0 text-xs text-gray-400">{formatoFecha(p.fecha)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel titulo="Cuentas" verHref="/cuentas">
          {cuentasList.length === 0 ? (
            <Vacio texto="Sin cuentas registradas." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {cuentasList.map((cu) => (
                <li key={cu.id} className="flex items-center gap-2 px-1 py-2 text-sm">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{plataformaLabel[cu.plataforma]}</span>
                  {cu.url ? (
                    <a href={cu.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                      {cu.usuario}
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span>{cu.usuario}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel titulo="Contenido reciente" verHref="/contenido">
        {contenido.length === 0 ? (
          <Vacio texto="Sin contenido todavía." />
        ) : (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {contenido.map((it) => {
              const path = miniMap[it.id]
              const url = path ? firmadas[path] : null
              const m = estadoMeta[it.estado]
              return (
                <li key={it.id}>
                  <Link
                    href={`/contenido/${it.id}`}
                    className="block overflow-hidden rounded-lg border border-gray-200 transition hover:border-gray-300"
                  >
                    <div className="flex aspect-square items-center justify-center bg-gray-50">
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt={it.titulo} className="h-full w-full object-cover" />
                      ) : (
                        <span className={`h-2.5 w-2.5 rounded-full ${m.punto}`} />
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <Panel titulo="Brand kit">
        {c.notasMarca ? (
          <p className="whitespace-pre-wrap px-1 text-sm text-gray-700">{c.notasMarca}</p>
        ) : (
          <Vacio texto="Sin notas de marca. Agrégalas en Editar." />
        )}
      </Panel>
    </div>
  )
}

function Accion({ href, label, Icon }: { href: string; label: string; Icon: LucideIcon }) {
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

function Panel({ titulo, verHref, children }: { titulo: string; verHref?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center">
        <h2 className="font-medium">{titulo}</h2>
        {verHref && (
          <Link href={verHref} className="text-brand ml-auto text-xs hover:underline">
            Ver todo
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function Vacio({ texto }: { texto: string }) {
  return <p className="px-1 py-2 text-sm text-gray-400">{texto}</p>
}
