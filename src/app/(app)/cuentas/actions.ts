'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { cuentas, clientes } from '@/db/schema'
import { getUsuario } from '@/lib/dal'

export type CuentaState = { error?: string } | null

const PLATAFORMAS = ['facebook', 'instagram', 'tiktok', 'youtube', 'otro'] as const
type Plataforma = (typeof PLATAFORMAS)[number]

export async function crearCuenta(_prev: CuentaState, formData: FormData): Promise<CuentaState> {
  const u = await getUsuario()
  if (!u || u.rol !== 'jefa') return { error: 'No autorizado.' }

  const clienteId = String(formData.get('clienteId') ?? '')
  const plataformaRaw = String(formData.get('plataforma') ?? '')
  const plataforma: Plataforma = (PLATAFORMAS as readonly string[]).includes(plataformaRaw)
    ? (plataformaRaw as Plataforma)
    : 'otro'
  const usuario = String(formData.get('usuario') ?? '').trim()
  const url = String(formData.get('url') ?? '').trim() || null
  const notas = String(formData.get('notas') ?? '').trim() || null

  if (!clienteId) return { error: 'Elige una organización.' }
  if (!usuario) return { error: 'Pon el usuario o @handle.' }

  const c = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(and(eq(clientes.id, clienteId), eq(clientes.agenciaId, u.agenciaId)))
    .limit(1)
  if (!c[0]) return { error: 'Organización inválida.' }

  await db.insert(cuentas).values({ agenciaId: u.agenciaId, clienteId, plataforma, usuario, url, notas })
  revalidatePath('/cuentas')
  redirect('/cuentas')
}

export async function eliminarCuenta(formData: FormData): Promise<void> {
  const u = await getUsuario()
  if (!u || u.rol !== 'jefa') return
  const id = String(formData.get('id') ?? '')
  await db.delete(cuentas).where(and(eq(cuentas.id, id), eq(cuentas.agenciaId, u.agenciaId)))
  revalidatePath('/cuentas')
}
