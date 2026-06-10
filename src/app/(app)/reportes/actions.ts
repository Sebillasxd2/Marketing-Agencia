'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { reportesDiarios } from '@/db/schema'
import { getUsuario } from '@/lib/dal'
import { hoyISO } from '@/lib/fecha'

export type ReporteState = { ok?: true; error?: string } | null
export type RespuestaState = { ok?: true; error?: string } | null

/** El empleado crea o actualiza su reporte de hoy. */
export async function guardarReporte(_prev: ReporteState, formData: FormData): Promise<ReporteState> {
  const u = await getUsuario()
  if (!u) return { error: 'No autenticado.' }

  const queHice = String(formData.get('queHice') ?? '').trim()
  if (!queHice) return { error: 'Escribe al menos qué hiciste hoy.' }
  const bloqueos = String(formData.get('bloqueos') ?? '').trim() || null
  const planManana = String(formData.get('planManana') ?? '').trim() || null
  const fecha = hoyISO()

  const existente = await db
    .select({ id: reportesDiarios.id })
    .from(reportesDiarios)
    .where(
      and(
        eq(reportesDiarios.agenciaId, u.agenciaId),
        eq(reportesDiarios.empleadoId, u.id),
        eq(reportesDiarios.fecha, fecha),
      ),
    )
    .limit(1)

  if (existente[0]) {
    await db
      .update(reportesDiarios)
      .set({ queHice, bloqueos, planManana, estado: 'enviado', enviadoEn: new Date() })
      .where(eq(reportesDiarios.id, existente[0].id))
  } else {
    await db.insert(reportesDiarios).values({
      agenciaId: u.agenciaId,
      empleadoId: u.id,
      fecha,
      queHice,
      bloqueos,
      planManana,
      estado: 'enviado',
      enviadoEn: new Date(),
    })
  }

  revalidatePath('/reportes')
  revalidatePath('/dashboard')
  return { ok: true }
}

/** La jefa responde un reporte (y lo marca como leído). */
export async function responderReporte(_prev: RespuestaState, formData: FormData): Promise<RespuestaState> {
  const u = await getUsuario()
  if (!u || u.rol !== 'jefa') return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '')
  const respuesta = String(formData.get('respuesta') ?? '').trim() || null

  await db
    .update(reportesDiarios)
    .set({ respuestaJefa: respuesta, leidoPorJefa: true })
    .where(and(eq(reportesDiarios.id, id), eq(reportesDiarios.agenciaId, u.agenciaId)))

  revalidatePath(`/reportes/${id}`)
  revalidatePath('/reportes')
  return { ok: true }
}
