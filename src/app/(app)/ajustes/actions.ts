'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { perfiles } from '@/db/schema'
import { getUsuario } from '@/lib/dal'

export type NicknameState = { ok?: true; error?: string } | null

export async function actualizarNickname(_prev: NicknameState, formData: FormData): Promise<NicknameState> {
  const u = await getUsuario()
  if (!u) return { error: 'No autenticado.' }

  const nombre = String(formData.get('nombre') ?? '').trim()
  if (nombre.length < 2) return { error: 'El nombre es muy corto.' }

  await db.update(perfiles).set({ nombreCompleto: nombre }).where(eq(perfiles.id, u.id))
  revalidatePath('/ajustes')
  revalidatePath('/dashboard')
  return { ok: true }
}
