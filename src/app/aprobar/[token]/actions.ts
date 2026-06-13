'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { clientes, piezas } from '@/db/schema'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function clientePorToken(token: string) {
  if (!UUID_RE.test(token)) return null
  const c = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.tokenAprobacion, token)).limit(1)
  return c[0] ?? null
}

/** El cliente (dueño del negocio) aprueba una pieza desde el enlace público. */
export async function aprobarPiezaCliente(formData: FormData): Promise<void> {
  const token = String(formData.get('token') ?? '')
  const piezaId = String(formData.get('piezaId') ?? '')
  const c = await clientePorToken(token)
  if (!c) return
  await db
    .update(piezas)
    .set({ aprobadaCliente: true })
    .where(and(eq(piezas.id, piezaId), eq(piezas.clienteId, c.id), eq(piezas.estado, 'verde')))
  revalidatePath(`/aprobar/${token}`)
}

/** El cliente pide cambios → la pieza vuelve a "necesita ajustes" con su comentario. */
export async function pedirCambiosCliente(formData: FormData): Promise<void> {
  const token = String(formData.get('token') ?? '')
  const piezaId = String(formData.get('piezaId') ?? '')
  const comentario = String(formData.get('comentario') ?? '').trim()
  if (!comentario) return
  const c = await clientePorToken(token)
  if (!c) return
  await db
    .update(piezas)
    .set({ estado: 'amarillo', comentarioCliente: comentario, actualizadaEn: new Date() })
    .where(and(eq(piezas.id, piezaId), eq(piezas.clienteId, c.id)))
  revalidatePath(`/aprobar/${token}`)
}
