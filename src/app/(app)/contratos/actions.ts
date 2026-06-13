'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import {
  clientes,
  asignacionesCliente,
  piezas,
  versionesPieza,
  revisiones,
  respuestasChecklist,
  piezasReporte,
  googleTokens,
} from '@/db/schema'
import { getUsuario } from '@/lib/dal'
import { gmailCliente } from '@/lib/google'

export type ContratoState = { ok?: true; error?: string } | null

function leerCampos(formData: FormData) {
  const s = (k: string) => {
    const v = String(formData.get(k) ?? '').trim()
    return v === '' ? null : v
  }
  const estadoRaw = String(formData.get('estadoContrato') ?? 'activo')
  const estado = (['activo', 'pausado', 'finalizado'] as const).includes(estadoRaw as never)
    ? (estadoRaw as 'activo' | 'pausado' | 'finalizado')
    : 'activo'
  return {
    nombre: String(formData.get('nombre') ?? '').trim(),
    rubro: s('rubro'),
    ciudad: s('ciudad'),
    contacto: s('contacto'),
    telefono: s('telefono'),
    email: s('email'),
    inicioContrato: s('inicioContrato'),
    tarifaMensual: s('tarifaMensual'),
    estadoContrato: estado,
    notasMarca: s('notasMarca'),
  }
}

export async function crearContrato(_prev: ContratoState, formData: FormData): Promise<ContratoState> {
  const u = await getUsuario()
  if (!u || u.rol !== 'jefa') return { error: 'No autorizado.' }
  const campos = leerCampos(formData)
  if (!campos.nombre) return { error: 'El nombre del negocio es obligatorio.' }

  const [nuevo] = await db
    .insert(clientes)
    .values({ agenciaId: u.agenciaId, ...campos })
    .returning({ id: clientes.id })

  revalidatePath('/contratos')
  redirect(`/contratos/${nuevo.id}`)
}

export async function actualizarContrato(_prev: ContratoState, formData: FormData): Promise<ContratoState> {
  const u = await getUsuario()
  if (!u) return { error: 'No autenticado.' }
  const id = String(formData.get('id') ?? '')

  const existe = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(and(eq(clientes.id, id), eq(clientes.agenciaId, u.agenciaId)))
    .limit(1)
  if (!existe[0]) return { error: 'Contrato no encontrado.' }

  if (u.rol !== 'jefa') {
    const asg = await db
      .select({ id: asignacionesCliente.id })
      .from(asignacionesCliente)
      .where(and(eq(asignacionesCliente.clienteId, id), eq(asignacionesCliente.empleadoId, u.id)))
      .limit(1)
    if (!asg[0]) return { error: 'No tienes este contrato asignado.' }
  }

  const campos = leerCampos(formData)
  if (!campos.nombre) return { error: 'El nombre del negocio es obligatorio.' }

  await db.update(clientes).set(campos).where(eq(clientes.id, id))
  revalidatePath('/contratos')
  revalidatePath(`/contratos/${id}`)
  return { ok: true }
}

export async function eliminarContrato(formData: FormData): Promise<void> {
  const u = await getUsuario()
  if (!u || u.rol !== 'jefa') return
  const id = String(formData.get('id') ?? '')

  const existe = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(and(eq(clientes.id, id), eq(clientes.agenciaId, u.agenciaId)))
    .limit(1)
  if (!existe[0]) return

  const pz = await db.select({ id: piezas.id }).from(piezas).where(eq(piezas.clienteId, id))
  const ids = pz.map((p) => p.id)

  await db.transaction(async (tx) => {
    if (ids.length) {
      await tx.delete(piezasReporte).where(inArray(piezasReporte.piezaId, ids))
      await tx.delete(respuestasChecklist).where(inArray(respuestasChecklist.piezaId, ids))
      await tx.delete(revisiones).where(inArray(revisiones.piezaId, ids))
      await tx.delete(versionesPieza).where(inArray(versionesPieza.piezaId, ids))
      await tx.delete(piezas).where(inArray(piezas.id, ids))
    }
    await tx.delete(asignacionesCliente).where(eq(asignacionesCliente.clienteId, id))
    await tx.delete(clientes).where(eq(clientes.id, id))
  })

  revalidatePath('/contratos')
  redirect('/contratos')
}

export async function asignarEmpleado(formData: FormData): Promise<void> {
  const u = await getUsuario()
  if (!u || u.rol !== 'jefa') return
  const clienteId = String(formData.get('clienteId') ?? '')
  const empleadoId = String(formData.get('empleadoId') ?? '')

  const c = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(and(eq(clientes.id, clienteId), eq(clientes.agenciaId, u.agenciaId)))
    .limit(1)
  if (!c[0]) return

  const ya = await db
    .select({ id: asignacionesCliente.id })
    .from(asignacionesCliente)
    .where(and(eq(asignacionesCliente.clienteId, clienteId), eq(asignacionesCliente.empleadoId, empleadoId)))
    .limit(1)
  if (!ya[0]) {
    await db.insert(asignacionesCliente).values({ agenciaId: u.agenciaId, clienteId, empleadoId })
  }
  revalidatePath(`/contratos/${clienteId}`)
}

export async function quitarEmpleado(formData: FormData): Promise<void> {
  const u = await getUsuario()
  if (!u || u.rol !== 'jefa') return
  const clienteId = String(formData.get('clienteId') ?? '')
  const empleadoId = String(formData.get('empleadoId') ?? '')
  await db
    .delete(asignacionesCliente)
    .where(
      and(
        eq(asignacionesCliente.clienteId, clienteId),
        eq(asignacionesCliente.empleadoId, empleadoId),
        eq(asignacionesCliente.agenciaId, u.agenciaId),
      ),
    )
  revalidatePath(`/contratos/${clienteId}`)
}

export async function generarEnlaceAprobacion(formData: FormData): Promise<void> {
  const u = await getUsuario()
  if (!u || u.rol !== 'jefa') return
  const clienteId = String(formData.get('clienteId') ?? '')
  const c = await db
    .select({ token: clientes.tokenAprobacion })
    .from(clientes)
    .where(and(eq(clientes.id, clienteId), eq(clientes.agenciaId, u.agenciaId)))
    .limit(1)
  if (!c[0]) return
  if (!c[0].token) {
    await db.update(clientes).set({ tokenAprobacion: crypto.randomUUID() }).where(eq(clientes.id, clienteId))
  }
  revalidatePath(`/contratos/${clienteId}`)
}

export async function enviarEnlaceAprobacion(formData: FormData): Promise<void> {
  const u = await getUsuario()
  if (!u || u.rol !== 'jefa') return
  const clienteId = String(formData.get('clienteId') ?? '')
  const para = String(formData.get('email') ?? '').trim()
  if (!para) return

  const cRows = await db
    .select({ id: clientes.id, nombre: clientes.nombre, token: clientes.tokenAprobacion })
    .from(clientes)
    .where(and(eq(clientes.id, clienteId), eq(clientes.agenciaId, u.agenciaId)))
    .limit(1)
  const c = cRows[0]
  if (!c) return
  let token = c.token
  if (!token) {
    token = crypto.randomUUID()
    await db.update(clientes).set({ tokenAprobacion: token }).where(eq(clientes.id, clienteId))
  }

  const tok = (
    await db.select({ refreshToken: googleTokens.refreshToken }).from(googleTokens).where(eq(googleTokens.perfilId, u.id)).limit(1)
  )[0]
  if (!tok) return

  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = host.includes('localhost') ? 'http' : 'https'
  const link = `${proto}://${host}/aprobar/${token}`

  const asunto = `Aprobación de contenido — ${c.nombre}`
  const cuerpo = `Hola,\n\nTienes contenido listo para revisar y aprobar. Entra a este enlace (no necesitas cuenta):\n${link}\n\n¡Gracias!`
  const raw = [
    `To: ${para}`,
    `Subject: =?UTF-8?B?${Buffer.from(asunto).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    '',
    cuerpo,
  ].join('\r\n')
  const encoded = Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  try {
    const gmail = gmailCliente(tok.refreshToken)
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } })
  } catch {}
  revalidatePath(`/contratos/${clienteId}`)
}
