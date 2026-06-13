'use server'

import sharp from 'sharp'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { piezas, versionesPieza, revisiones, clientes, asignacionesCliente, checklists } from '@/db/schema'
import { getUsuario, type UsuarioActual } from '@/lib/dal'
import { createAdminClient } from '@/lib/supabase/admin'
import { BUCKET } from '@/lib/storage'
import { hoyISO } from '@/lib/fecha'

export type SubirState = { error?: string } | null
export type RevisionState = { ok?: true; error?: string } | null
export type EnvioState = { error?: string } | null

type AdminClient = ReturnType<typeof createAdminClient>

/** Sube un archivo (original + miniatura si es imagen) y devuelve las rutas. */
async function subirUnArchivo(admin: AdminClient, file: File, baseRuta: string) {
  const buf = Buffer.from(await file.arrayBuffer())
  const esVideo = file.type.startsWith('video/')
  const tipo: 'imagen' | 'video' = esVideo ? 'video' : 'imagen'
  const ext = (file.name.split('.').pop() || (esVideo ? 'mp4' : 'jpg')).toLowerCase().replace(/[^a-z0-9]/g, '')
  const archivoPath = `${baseRuta}.${ext}`

  const up = await admin.storage.from(BUCKET).upload(archivoPath, buf, {
    contentType: file.type || 'application/octet-stream',
  })
  if (up.error) throw new Error(up.error.message)

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
  return { archivoPath, miniaturaPath, tipo }
}

async function tieneAccesoCliente(u: UsuarioActual, clienteId: string): Promise<boolean> {
  if (u.rol === 'jefa') return true
  const asg = await db
    .select({ id: asignacionesCliente.id })
    .from(asignacionesCliente)
    .where(and(eq(asignacionesCliente.clienteId, clienteId), eq(asignacionesCliente.empleadoId, u.id)))
    .limit(1)
  return !!asg[0]
}

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
  if (!(await tieneAccesoCliente(u, clienteId))) return { error: 'No tienes esa organización asignada.' }

  const admin = createAdminClient()
  let i = 0
  for (const file of archivos) {
    i++
    let res
    try {
      res = await subirUnArchivo(admin, file, `${u.agenciaId}/${u.id}/${clienteId}/${fechaProduccion}/${Date.now()}_${i}`)
    } catch (e) {
      return { error: `No se pudo subir el archivo: ${(e as Error).message}` }
    }
    const etiqueta = res.tipo === 'video' ? 'Video' : 'Foto'
    const titulo = produccionPara ? `${etiqueta} ${i} — ${produccionPara}` : `${etiqueta} ${i}`

    const [p] = await db
      .insert(piezas)
      .values({
        agenciaId: u.agenciaId,
        clienteId,
        titulo,
        tipo: res.tipo,
        estado: 'borrador', // arranca en borrador → pasa por el gate de checklist
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
      archivoUrl: res.archivoPath,
      miniaturaUrl: res.miniaturaPath,
      subidaPor: u.id,
    })
  }

  revalidatePath('/contenido')
  redirect('/contenido')
}

/** Gate del estándar de la casa: solo pasa a revisión si se cumplen los checks obligatorios. */
export async function enviarARevision(_prev: EnvioState, formData: FormData): Promise<EnvioState> {
  const u = await getUsuario()
  if (!u) return { error: 'No autenticado.' }
  const piezaId = String(formData.get('piezaId') ?? '')

  const rows = await db
    .select({ id: piezas.id, tipo: piezas.tipo, estado: piezas.estado, creadaPor: piezas.creadaPor })
    .from(piezas)
    .where(and(eq(piezas.id, piezaId), eq(piezas.agenciaId, u.agenciaId)))
    .limit(1)
  const p = rows[0]
  if (!p) return { error: 'No encontrado.' }
  if (p.creadaPor !== u.id && u.rol !== 'jefa') return { error: 'No es tu pieza.' }
  if (p.estado !== 'borrador') return { error: 'Esta pieza ya fue enviada.' }

  const cl = await db
    .select({ itemsJson: checklists.itemsJson })
    .from(checklists)
    .where(and(eq(checklists.agenciaId, u.agenciaId), eq(checklists.tipoPieza, p.tipo)))
    .limit(1)
  const items = cl[0]?.itemsJson ?? []
  const checked = new Set(formData.getAll('check').map(String))
  const faltan = items.filter((it, i) => it.obligatorio && !checked.has(String(i)))
  if (faltan.length) {
    return { error: `Antes de enviar, cumple: ${faltan.map((f) => `"${f.texto}"`).join(', ')}` }
  }

  await db.update(piezas).set({ estado: 'en_revision', actualizadaEn: new Date() }).where(eq(piezas.id, piezaId))
  revalidatePath(`/contenido/${piezaId}`)
  revalidatePath('/contenido')
  return null
}

/** El empleado sube la versión corregida tras un amarillo → nueva versión, vuelve a revisión. */
export async function subirCorreccion(_prev: SubirState, formData: FormData): Promise<SubirState> {
  const u = await getUsuario()
  if (!u) return { error: 'No autenticado.' }
  const piezaId = String(formData.get('piezaId') ?? '')

  const rows = await db
    .select({ id: piezas.id, clienteId: piezas.clienteId, estado: piezas.estado, creadaPor: piezas.creadaPor, versionActual: piezas.versionActual })
    .from(piezas)
    .where(and(eq(piezas.id, piezaId), eq(piezas.agenciaId, u.agenciaId)))
    .limit(1)
  const p = rows[0]
  if (!p) return { error: 'No encontrado.' }
  if (p.creadaPor !== u.id) return { error: 'No es tu pieza.' }

  const file = formData.get('archivo')
  if (!(file instanceof File) || file.size === 0) return { error: 'Sube el archivo corregido.' }

  const admin = createAdminClient()
  const nuevaVersion = p.versionActual + 1
  let res
  try {
    res = await subirUnArchivo(admin, file, `${u.agenciaId}/${u.id}/${p.clienteId}/correccion/${Date.now()}_v${nuevaVersion}`)
  } catch (e) {
    return { error: `No se pudo subir: ${(e as Error).message}` }
  }

  await db.insert(versionesPieza).values({
    agenciaId: u.agenciaId,
    piezaId,
    numeroVersion: nuevaVersion,
    tipoContenido: 'archivo',
    archivoUrl: res.archivoPath,
    miniaturaUrl: res.miniaturaPath,
    subidaPor: u.id,
  })
  await db.update(piezas).set({ estado: 'en_revision', versionActual: nuevaVersion, actualizadaEn: new Date() }).where(eq(piezas.id, piezaId))

  revalidatePath(`/contenido/${piezaId}`)
  revalidatePath('/contenido')
  return null
}

/** Marca una pieza aprobada como publicada (con enlace opcional). */
export async function marcarPublicada(formData: FormData): Promise<void> {
  const u = await getUsuario()
  if (!u) return
  const piezaId = String(formData.get('piezaId') ?? '')
  const enlace = String(formData.get('enlace') ?? '').trim() || null
  await db
    .update(piezas)
    .set({ publicada: true, enlacePublicacion: enlace })
    .where(and(eq(piezas.id, piezaId), eq(piezas.agenciaId, u.agenciaId), eq(piezas.estado, 'verde')))
  revalidatePath(`/contenido/${piezaId}`)
  revalidatePath('/contenido')
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
