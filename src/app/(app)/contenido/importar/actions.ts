'use server'

import sharp from 'sharp'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { googleTokens, clientes, asignacionesCliente, piezas, versionesPieza } from '@/db/schema'
import { getUsuario } from '@/lib/dal'
import { driveCliente } from '@/lib/google'
import { createAdminClient } from '@/lib/supabase/admin'
import { BUCKET } from '@/lib/storage'
import { hoyISO } from '@/lib/fecha'

export type ImportState = { error?: string } | null

export async function importarDeDrive(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const u = await getUsuario()
  if (!u) return { error: 'No autenticado.' }

  const clienteId = String(formData.get('clienteId') ?? '')
  const fechaProduccion = String(formData.get('fechaProduccion') ?? '').trim() || hoyISO()
  const produccionPara = String(formData.get('produccionPara') ?? '').trim() || null
  const fileIds = formData.getAll('file').map(String).filter(Boolean)

  if (!clienteId) return { error: 'Elige una organización.' }
  if (fileIds.length === 0) return { error: 'Selecciona al menos un archivo.' }

  const c = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(and(eq(clientes.id, clienteId), eq(clientes.agenciaId, u.agenciaId)))
    .limit(1)
  if (!c[0]) return { error: 'Organización inválida.' }
  if (u.rol === 'empleado') {
    const a = await db
      .select({ id: asignacionesCliente.id })
      .from(asignacionesCliente)
      .where(and(eq(asignacionesCliente.clienteId, clienteId), eq(asignacionesCliente.empleadoId, u.id)))
      .limit(1)
    if (!a[0]) return { error: 'No tienes esa organización asignada.' }
  }

  const tok = (
    await db.select({ refreshToken: googleTokens.refreshToken }).from(googleTokens).where(eq(googleTokens.perfilId, u.id)).limit(1)
  )[0]
  if (!tok) return { error: 'Conecta tu Google Drive primero.' }

  const drive = driveCliente(tok.refreshToken)
  const admin = createAdminClient()
  let i = 0
  for (const fileId of fileIds) {
    i++
    let name = `archivo_${i}`
    let mime = ''
    try {
      const meta = await drive.files.get({ fileId, fields: 'name, mimeType' })
      name = meta.data.name ?? name
      mime = meta.data.mimeType ?? ''
    } catch {
      return { error: 'No se pudo leer un archivo de Drive.' }
    }

    let buf: Buffer
    try {
      const dl = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' })
      buf = Buffer.from(dl.data as ArrayBuffer)
    } catch {
      return { error: 'No se pudo descargar un archivo de Drive.' }
    }

    const esVideo = mime.startsWith('video/')
    const tipo: 'imagen' | 'video' = esVideo ? 'video' : 'imagen'
    const ext = (name.split('.').pop() || (esVideo ? 'mp4' : 'jpg')).toLowerCase().replace(/[^a-z0-9]/g, '')
    const baseRuta = `${u.agenciaId}/${u.id}/${clienteId}/${fechaProduccion}/drive_${Date.now()}_${i}`
    const archivoPath = `${baseRuta}.${ext}`

    const up = await admin.storage.from(BUCKET).upload(archivoPath, buf, { contentType: mime || 'application/octet-stream' })
    if (up.error) return { error: `No se pudo guardar: ${up.error.message}` }

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
    const titulo = produccionPara ? `${etiqueta} ${i} — ${produccionPara}` : name

    const [p] = await db
      .insert(piezas)
      .values({
        agenciaId: u.agenciaId,
        clienteId,
        titulo,
        tipo,
        estado: 'borrador',
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
