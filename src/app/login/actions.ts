'use server'

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { miembrosAgencia } from '@/db/schema'

async function rutaPorRol(userId: string): Promise<string> {
  const rows = await db
    .select({ rol: miembrosAgencia.rol })
    .from(miembrosAgencia)
    .where(eq(miembrosAgencia.perfilId, userId))
    .limit(1)
  return rows[0]?.rol === 'jefa' ? '/jefa' : '/empleado'
}

export type LoginState = { error: string } | null

/** Login manual con correo y contraseña. */
export async function iniciarSesion(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) return { error: 'Correo o contraseña incorrectos.' }

  redirect(await rutaPorRol(data.user.id))
}

/** Acceso rápido de la demo (contraseña fija). */
export async function accesoRapido(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '')
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: 'vertice123' })
  if (error || !data.user) return
  redirect(await rutaPorRol(data.user.id))
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
