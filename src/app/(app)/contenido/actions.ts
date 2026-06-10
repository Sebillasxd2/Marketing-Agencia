'use server'

import sharp from 'sharp'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { piezas, versionesPieza, revisiones, clientes, asignacionesCliente } from '@/db/schema'
import { getUsuario } from '@/lib/dal'
import { createAdminClient } from '@/lib/supabase/admin'
import { BUCKET } from '@/lib/storage'
import { hoyISO } from '@/lib/fecha'

export type SubirState = { error?: string } | null
export type RevisionState = { ok?: true; error?: string } | null

export async function subirContenido(_prev: SubirState, formData: FormData): Promise<SubirState> {
  const u = await getUsuario()
  if (!u) return { error: 'No autenticado.' }

  const clienteId = String(formData.get('clienteId') ?? '')
  const fechaProduccion = String(formData.get('fechaProduccion') ?? '').trim() || hoyISO()
  const produccionPara = String(formData.get('produccionPara') ?? '').trim() || null
  const archivos = formData.getAll('archivos').filter((f): f is File => f instanceof File && f.size > 0)

  if (!clienteId) return { error: 'Elige una organización.' }
  if (archivos.length === 0) return { error: 'Sube al menos un archivo.' }

  const c = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(and(eq(clientes.id, clienteId), eq(clientes.agenciaId, u.agenciaId)))
    .limit(1)
  if (!c[0]) return { error: 'Organización inválida.' }

  if (u.rol === 'empleado') {
    const asg = await db
      .select({ id: asignacionesCliente.id })
      .from(asignacionesCliente)
      .where(and(eq(asignacionesCliente.clienteId, clienteId), eq(asignacionesCliente.empleadoId, u.id)))
      .limit(1)
    if (!asg[0]) return { error: 'No tienes esa organización asignada.' }
  }

  const admin = createAdminClient()
  let i = 0
  for (const file of archivos) {
    i++
    const buf = Buffer.from(await file.arrayBuffer())
    const esVideo = file.type.startsWith('video/')
    const tipo: 'imagen' | 'video' = esVideo ? 'video' : 'imagen'
    const ext = (file.name.split('.').pop() || (esVideo ? 'mp4' : 'jpg')).toLowerCase().replace(/[^a-z0-9]/g, '')
    const baseRuta = `${u.agenciaId}/${u.id}/${clienteId}/${fechaProduccion}/${Date.now()}_${i}`
    const archivoPath = `${baseRuta}.${ext}`

    const up = await admin.storage.from(BUCKET).upload(archivoPath, buf, {
      contentType: file.type || 'application/octet-stream',
    })
    if (up.error) return { error: `No se pudo subir el archivo: ${up.error.message}` }

    let miniaturaPath: string | null = null
    if (!esVideo) {
      try {
        const thumb = await sharp(buf).rotate().resize(600, 600, { fit: 'inside' }).webp({ quality: 72 }).toBuffer()
        miniaturaPath = `${baseRuta}_thumb.webp`
        await admin.storage.from(BUCKET).upload(miniaturaPath, thumb, { contentType: 'image/webp' })
      } catch {
        miniaturaPath = null
      }
    }

    const etiqueta = esVideo ? 'Video' : 'Foto'
    const titulo = produccionPara ? `${etiqueta} ${i} — ${produccionPara}` : `${etiqueta} ${i}`

    const [p] = await db
      .insert(piezas)
      .values({
        agenciaId: u.agenciaId,
        clienteId,
        titulo,
        tipo,
        estado: 'en_revision',
        versionActual: 1,
        produccionPara,
        fechaProduccion,
        creadaPor: u.id,
      })
      .returning({ id: piezas.id })

    await db.insert(versionesPieza).values({
      agenciaId: u.agenciaId,
      piezaId: p.id,
      numeroVersion: 1,
      tipoContenido: 'archivo',
      archivoUrl: archivoPath,
      miniaturaUrl: miniaturaPath,
      subidaPor: u.id,
    })
  }

  revalidatePath('/contenido')
  redirect('/contenido')
}

export async function revisarContenido(_prev: RevisionState, formData: FormData): Promise<RevisionState> {
  const u = await getUsuario()
  if (!u || u.rol !== 'jefa') return { error: 'Solo la jefa puede revisar.' }

  const piezaId = String(formData.get('piezaId') ?? '')
  const version = Number(formData.get('version') ?? '1') || 1
  const color = String(formData.get('color') ?? '')
  if (!['verde', 'amarillo', 'rojo'].includes(color)) return { error: 'Elige verde, amarillo o rojo.' }
  const comentario = String(formData.get('comentario') ?? '').trim() || null
  if ((color === 'amarillo' || color === 'rojo') && !comentario) return { error: 'Escribe qué ajustar o por qué no va.' }

  const pz = await db
    .select({ id: piezas.id })
    .from(piezas)
    .where(and(eq(piezas.id, piezaId), eq(piezas.agenciaId, u.agenciaId)))
    .limit(1)
  if (!pz[0]) return { error: 'No encontrado.' }

  const colorTyped = color as 'verde' | 'amarillo' | 'rojo'
  await db.insert(revisiones).values({
    agenciaId: u.agenciaId,
    piezaId,
    versionRevisada: version,
    color: colorTyped,
    comentario,
    revisadaPor: u.id,
  })
  await db.update(piezas).set({ estado: colorTyped, actualizadaEn: new Date() }).where(eq(piezas.id, piezaId))

  revalidatePath(`/contenido/${piezaId}`)
  revalidatePath('/contenido')
  return { ok: true }
}
