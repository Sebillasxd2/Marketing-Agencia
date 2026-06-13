'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { publicaciones, clientes, asignacionesCliente } from '@/db/schema'
import { getUsuario, type UsuarioActual } from '@/lib/dal'

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
