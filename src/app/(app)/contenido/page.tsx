import Link from 'next/link'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { Upload, Cloud, Image as ImageIcon, Film } from 'lucide-react'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { piezas, versionesPieza, clientes, perfiles } from '@/db/schema'
import { urlsFirmadas } from '@/lib/storage'
import { estadoMeta } from '@/lib/estados'
import { formatoFecha } from '@/lib/fecha'

export default async function ContenidoPage() {
  const u = await requireUsuario()

  const cond =
    u.rol === 'jefa'
      ? and(eq(piezas.agenciaId, u.agenciaId), inArray(piezas.tipo, ['imagen', 'video']))
      : and(eq(piezas.agenciaId, u.agenciaId), eq(piezas.creadaPor, u.id), inArray(piezas.tipo, ['imagen', 'video']))

  const items = await db
    .select({
      id: piezas.id,
      titulo: piezas.titulo,
      tipo: piezas.tipo,
      estado: piezas.estado,
      versionActual: piezas.versionActual,
      fechaProduccion: piezas.fechaProduccion,
      cliente: clientes.nombre,
      autor: perfiles.nombreCompleto,
    })
    .from(piezas)
    .innerJoin(clientes, eq(clientes.id, piezas.clienteId))
    .innerJoin(perfiles, eq(perfiles.id, piezas.creadaPor))
    .where(cond)
    .orderBy(desc(piezas.creadaEn))

  const ids = items.map((p) => p.id)
  const vers = ids.length
    ? await db
        .select({ piezaId: versionesPieza.piezaId, numeroVersion: versionesPieza.numeroVersion, miniaturaUrl: versionesPieza.miniaturaUrl })
        .from(versionesPieza)
        .where(inArray(versionesPieza.piezaId, ids))
    : []

  const miniPorPieza: Record<string, string | null> = {}
  for (const it of items) {
    const v = vers.find((x) => x.piezaId === it.id && x.numeroVersion === it.versionActual) ?? vers.find((x) => x.piezaId === it.id)
    miniPorPieza[it.id] = v?.miniaturaUrl ?? null
  }
  const firmadas = await urlsFirmadas(Object.values(miniPorPieza).filter((p): p is string => !!p))

  // Agrupar: organización → fecha
  const grupos = new Map<string, Map<string, typeof items>>()
  for (const it of items) {
    const fecha = it.fechaProduccion ?? 'Sin fecha'
    if (!grupos.has(it.cliente)) grupos.set(it.cliente, new Map())
    const g = grupos.get(it.cliente)!
    if (!g.has(fecha)) g.set(fecha, [])
    g.get(fecha)!.push(it)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contenido</h1>
          <p className="mt-1 text-sm text-gray-500">
            {u.rol === 'jefa' ? 'Todo el contenido del equipo, por organización y fecha.' : 'Tu contenido, por organización y fecha.'}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link
            href="/contenido/importar"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <Cloud size={16} /> Importar de Drive
          </Link>
          <Link
            href="/contenido/subir"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Upload size={16} /> Subir contenido
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 px-5 py-12 text-center text-sm text-gray-400">
          Aún no hay contenido. Sube el primero.
        </p>
      ) : (
        [...grupos.entries()].map(([cliente, fechas]) => (
          <section key={cliente} className="space-y-3">
            <h2 className="font-medium">{cliente}</h2>
            {[...fechas.entries()].map(([fecha, its]) => (
              <div key={fecha} className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {fecha === 'Sin fecha' ? fecha : formatoFecha(fecha)}
                </div>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {its.map((it) => {
                    const m = estadoMeta[it.estado]
                    const mini = miniPorPieza[it.id]
                    const url = mini ? firmadas[mini] : null
                    return (
                      <li key={it.id}>
                        <Link
                          href={`/contenido/${it.id}`}
                          className="block overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-gray-300 hover:shadow-sm"
                        >
                          <div className="flex aspect-square items-center justify-center bg-gray-50">
                            {url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={url} alt={it.titulo} className="h-full w-full object-cover" />
                            ) : it.tipo === 'video' ? (
                              <Film className="text-gray-300" size={32} />
                            ) : (
                              <ImageIcon className="text-gray-300" size={32} />
                            )}
                          </div>
                          <div className="p-2">
                            <p className="truncate text-xs font-medium">{it.titulo}</p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${m.punto}`} />
                              <span className="text-[11px] text-gray-500">{m.label}</span>
                              {u.rol === 'jefa' && <span className="ml-auto truncate text-[11px] text-gray-400">{it.autor.split(' ')[0]}</span>}
                            </div>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  )
}
