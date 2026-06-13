import Link from 'next/link'
import { and, asc, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { requireUsuario } from '@/lib/dal'
import { db } from '@/db'
import { piezas, versionesPieza, revisiones, clientes, perfiles, checklists } from '@/db/schema'
import { urlsFirmadas } from '@/lib/storage'
import { estadoMeta, tipoLabel } from '@/lib/estados'
import { formatoFecha } from '@/lib/fecha'
import { RevisarForm } from './RevisarForm'
import { ChecklistGate } from './ChecklistGate'
import { CorreccionForm } from './CorreccionForm'
import { PublicarForm } from './PublicarForm'

export default async function ContenidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const u = await requireUsuario()

  const [rows, revs] = await Promise.all([
    db
      .select({
        id: piezas.id,
        titulo: piezas.titulo,
        tipo: piezas.tipo,
        estado: piezas.estado,
        versionActual: piezas.versionActual,
        fechaProduccion: piezas.fechaProduccion,
        produccionPara: piezas.produccionPara,
        publicada: piezas.publicada,
        enlacePublicacion: piezas.enlacePublicacion,
        aprobadaCliente: piezas.aprobadaCliente,
        comentarioCliente: piezas.comentarioCliente,
        cliente: clientes.nombre,
        autor: perfiles.nombreCompleto,
        creadaPor: piezas.creadaPor,
      })
      .from(piezas)
      .innerJoin(clientes, eq(clientes.id, piezas.clienteId))
      .innerJoin(perfiles, eq(perfiles.id, piezas.creadaPor))
      .where(and(eq(piezas.id, id), eq(piezas.agenciaId, u.agenciaId)))
      .limit(1),
    db
      .select({
        id: revisiones.id,
        color: revisiones.color,
        comentario: revisiones.comentario,
        version: revisiones.versionRevisada,
        autor: perfiles.nombreCompleto,
      })
      .from(revisiones)
      .innerJoin(perfiles, eq(perfiles.id, revisiones.revisadaPor))
      .where(eq(revisiones.piezaId, id))
      .orderBy(asc(revisiones.revisadaEn)),
  ])

  const p = rows[0]
  if (!p) redirect('/contenido')
  const esAutor = p.creadaPor === u.id
  if (u.rol === 'empleado' && !esAutor) redirect('/contenido')

  const verActual = await db
    .select()
    .from(versionesPieza)
    .where(and(eq(versionesPieza.piezaId, id), eq(versionesPieza.numeroVersion, p.versionActual)))
    .limit(1)
  const ver = verActual[0] ?? (await db.select().from(versionesPieza).where(eq(versionesPieza.piezaId, id)).limit(1))[0]
  const firmadas = ver?.archivoUrl ? await urlsFirmadas([ver.archivoUrl]) : {}
  const url = ver?.archivoUrl ? firmadas[ver.archivoUrl] : null

  let checklistItems: { texto: string; obligatorio: boolean }[] = []
  if (p.estado === 'borrador') {
    const cl = await db
      .select({ itemsJson: checklists.itemsJson })
      .from(checklists)
      .where(and(eq(checklists.agenciaId, u.agenciaId), eq(checklists.tipoPieza, p.tipo)))
      .limit(1)
    checklistItems = cl[0]?.itemsJson ?? []
  }

  const m = estadoMeta[p.estado]

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/contenido" className="text-sm text-gray-500 transition hover:text-gray-700">
        ← Volver a contenido
      </Link>

      <div className="flex items-start gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{p.titulo}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {p.cliente} · {p.fechaProduccion ? formatoFecha(p.fechaProduccion) : 'sin fecha'} · {tipoLabel[p.tipo]} · v{p.versionActual}
          </p>
        </div>
        <div className="ml-auto flex flex-col items-end gap-1">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${m.clase}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${m.punto}`} />
            {m.label}
          </span>
          {p.aprobadaCliente && (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Aprobado por cliente</span>
          )}
          {p.publicada && (
            <span className="bg-brand-soft text-brand rounded-full px-2.5 py-0.5 text-xs font-medium">Publicado</span>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
        {url ? (
          p.tipo === 'video' ? (
            <video src={url} controls className="max-h-[60vh] w-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={p.titulo} className="max-h-[60vh] w-full object-contain" />
          )
        ) : (
          <div className="flex aspect-video items-center justify-center text-sm text-gray-400">
            Sin vista previa{ver?.enlaceDrive ? ' (enlace de Drive)' : ''}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">
        Subido por <span className="text-gray-700">{p.autor}</span>
        {p.produccionPara && (
          <>
            {' '}· Para <span className="text-gray-700">{p.produccionPara}</span>
          </>
        )}
        {p.publicada && p.enlacePublicacion && (
          <>
            {' '}·{' '}
            <a href={p.enlacePublicacion} target="_blank" rel="noreferrer" className="text-brand inline-flex items-center gap-1 hover:underline">
              Ver publicación <ExternalLink size={12} />
            </a>
          </>
        )}
      </p>

      {p.comentarioCliente && p.estado === 'amarillo' && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          💬 El cliente pidió cambios: «{p.comentarioCliente}»
        </div>
      )}

      {/* Gate de checklist (borrador) */}
      {p.estado === 'borrador' && (esAutor || u.rol === 'jefa') && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-medium">Estándar de la casa</h2>
          <p className="mb-3 mt-0.5 text-xs text-gray-500">Cumple el estándar antes de mandarlo a revisión.</p>
          <ChecklistGate piezaId={p.id} items={checklistItems} />
        </section>
      )}

      {/* Corrección (amarillo, autor) */}
      {p.estado === 'amarillo' && esAutor && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="font-medium text-amber-800">Necesita ajustes</h2>
          <p className="mb-3 mt-0.5 text-xs text-amber-700">Sube la versión corregida; volverá a revisión como una nueva versión.</p>
          <CorreccionForm piezaId={p.id} />
        </section>
      )}

      {/* Publicar (verde, no publicada) */}
      {p.estado === 'verde' && !p.publicada && (u.rol === 'jefa' || esAutor) && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-medium">¿Ya se publicó?</h2>
          <PublicarForm piezaId={p.id} />
        </section>
      )}

      {/* Revisiones */}
      {revs.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium">Revisiones</h2>
          <ul className="space-y-2">
            {revs.map((r) => {
              const rm = estadoMeta[r.color]
              return (
                <li key={r.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${rm.clase}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${rm.punto}`} />
                      {rm.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      v{r.version} · {r.autor}
                    </span>
                  </div>
                  {r.comentario && <p className="mt-1 text-sm text-gray-700">{r.comentario}</p>}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Revisar (jefa) */}
      {u.rol === 'jefa' && p.estado !== 'borrador' && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-medium">Revisar</h2>
          <RevisarForm piezaId={p.id} version={p.versionActual} />
        </section>
      )}
    </div>
  )
}
