'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { publicaciones, clientes, asignacionesCliente, googleTokens } from '@/db/schema'
import { getUsuario, type UsuarioActual } from '@/lib/dal'
import { calendarCliente } from '@/lib/google'

export type PubState = { error?: string } | null

const ESTADOS = ['idea', 'produccion', 'aprobado', 'publicado'] as const
const REDES = ['facebook', 'instagram', 'tiktok', 'youtube', 'otro'] as const
type Estado = (typeof ESTADOS)[number]
type Red = (typeof REDES)[number]

async function puedeUsarCliente(u: UsuarioActual, clienteId: string): Promise<boolean> {
  const c = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(and(eq(clientes.id, clienteId), eq(clientes.agenciaId, u.agenciaId)))
    .limit(1)
  if (!c[0]) return false
  if (u.rol === 'jefa') return true
  const a = await db
    .select({ id: asignacionesCliente.id })
    .from(asignacionesCliente)
    .where(and(eq(asignacionesCliente.clienteId, clienteId), eq(asignacionesCliente.empleadoId, u.id)))
    .limit(1)
  return !!a[0]
}

function leer(formData: FormData) {
  const redRaw = String(formData.get('red') ?? '')
  const estadoRaw = String(formData.get('estado') ?? 'idea')
  return {
    clienteId: String(formData.get('clienteId') ?? ''),
    fecha: String(formData.get('fecha') ?? '').trim(),
    titulo: String(formData.get('titulo') ?? '').trim(),
    red: (REDES as readonly string[]).includes(redRaw) ? (redRaw as Red) : null,
    estado: (ESTADOS as readonly string[]).includes(estadoRaw) ? (estadoRaw as Estado) : ('idea' as Estado),
    notas: String(formData.get('notas') ?? '').trim() || null,
    asignadoA: String(formData.get('asignadoA') ?? '').trim() || null,
  }
}

export async function crearPublicacion(_prev: PubState, formData: FormData): Promise<PubState> {
  const u = await getUsuario()
  if (!u) return { error: 'No autenticado.' }
  const d = leer(formData)
  if (!d.clienteId) return { error: 'Elige una organización.' }
  if (!d.fecha) return { error: 'Elige una fecha.' }
  if (!d.titulo) return { error: 'Pon un título.' }
  if (!(await puedeUsarCliente(u, d.clienteId))) return { error: 'No tienes acceso a esa organización.' }

  await db.insert(publicaciones).values({
    agenciaId: u.agenciaId,
    clienteId: d.clienteId,
    fecha: d.fecha,
    titulo: d.titulo,
    red: d.red,
    estado: d.estado,
    notas: d.notas,
    asignadoA: d.asignadoA,
    creadaPor: u.id,
  })
  revalidatePath('/calendario')
  redirect(`/calendario?mes=${d.fecha.slice(0, 7)}`)
}

export async function actualizarPublicacion(_prev: PubState, formData: FormData): Promise<PubState> {
  const u = await getUsuario()
  if (!u) return { error: 'No autenticado.' }
  const id = String(formData.get('id') ?? '')
  const existe = await db
    .select({ id: publicaciones.id })
    .from(publicaciones)
    .where(and(eq(publicaciones.id, id), eq(publicaciones.agenciaId, u.agenciaId)))
    .limit(1)
  if (!existe[0]) return { error: 'No encontrado.' }

  const d = leer(formData)
  if (!d.titulo) return { error: 'Pon un título.' }
  if (!(await puedeUsarCliente(u, d.clienteId))) return { error: 'Sin acceso a esa organización.' }

  await db
    .update(publicaciones)
    .set({ clienteId: d.clienteId, fecha: d.fecha, titulo: d.titulo, red: d.red, estado: d.estado, notas: d.notas, asignadoA: d.asignadoA })
    .where(eq(publicaciones.id, id))
  revalidatePath('/calendario')
  revalidatePath(`/calendario/${id}`)
  redirect(`/calendario?mes=${d.fecha.slice(0, 7)}`)
}

export async function cambiarEstadoPublicacion(formData: FormData): Promise<void> {
  const u = await getUsuario()
  if (!u) return
  const id = String(formData.get('id') ?? '')
  const estadoRaw = String(formData.get('estado') ?? '')
  if (!(ESTADOS as readonly string[]).includes(estadoRaw)) return
  await db
    .update(publicaciones)
    .set({ estado: estadoRaw as Estado })
    .where(and(eq(publicaciones.id, id), eq(publicaciones.agenciaId, u.agenciaId)))
  revalidatePath('/calendario')
  revalidatePath(`/calendario/${id}`)
}

export async function eliminarPublicacion(formData: FormData): Promise<void> {
  const u = await getUsuario()
  if (!u) return
  const id = String(formData.get('id') ?? '')
  const cond =
    u.rol === 'jefa'
      ? and(eq(publicaciones.id, id), eq(publicaciones.agenciaId, u.agenciaId))
      : and(eq(publicaciones.id, id), eq(publicaciones.agenciaId, u.agenciaId), eq(publicaciones.creadaPor, u.id))
  await db.delete(publicaciones).where(cond)
  revalidatePath('/calendario')
  redirect('/calendario')
}

function diaSiguiente(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Crea/actualiza en Google Calendar los eventos de las publicaciones del mes visible. */
export async function sincronizarCalendario(formData: FormData): Promise<void> {
  const u = await getUsuario()
  if (!u) return
  const mes = String(formData.get('mes') ?? '')
  if (!/^\d{4}-\d{2}$/.test(mes)) return

  const tok = (
    await db.select({ refreshToken: googleTokens.refreshToken }).from(googleTokens).where(eq(googleTokens.perfilId, u.id)).limit(1)
  )[0]
  if (!tok) return

  const accesibles =
    u.rol === 'jefa'
      ? await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.agenciaId, u.agenciaId))
      : await db
          .select({ id: asignacionesCliente.clienteId })
          .from(asignacionesCliente)
          .where(and(eq(asignacionesCliente.agenciaId, u.agenciaId), eq(asignacionesCliente.empleadoId, u.id)))
  const ids = new Set(accesibles.map((c) => c.id))

  const todas = await db
    .select({
      id: publicaciones.id,
      fecha: publicaciones.fecha,
      titulo: publicaciones.titulo,
      estado: publicaciones.estado,
      notas: publicaciones.notas,
      googleEventId: publicaciones.googleEventId,
      clienteId: publicaciones.clienteId,
      cliente: clientes.nombre,
    })
    .from(publicaciones)
    .innerJoin(clientes, eq(clientes.id, publicaciones.clienteId))
    .where(eq(publicaciones.agenciaId, u.agenciaId))
  const pubs = todas.filter((p) => p.fecha.startsWith(mes) && ids.has(p.clienteId))

  const cal = calendarCliente(tok.refreshToken)
  for (const p of pubs) {
    const evento = {
      summary: `${p.cliente}: ${p.titulo}`,
      description: `Vértice · estado: ${p.estado}${p.notas ? `\n${p.notas}` : ''}`,
      start: { date: p.fecha },
      end: { date: diaSiguiente(p.fecha) },
    }
    try {
      if (p.googleEventId) {
        await cal.events.update({ calendarId: 'primary', eventId: p.googleEventId, requestBody: evento })
      } else {
        const r = await cal.events.insert({ calendarId: 'primary', requestBody: evento })
        if (r.data.id) await db.update(publicaciones).set({ googleEventId: r.data.id }).where(eq(publicaciones.id, p.id))
      }
    } catch {}
  }
  revalidatePath('/calendario')
}
