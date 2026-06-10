'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { perfiles, miembrosAgencia } from '@/db/schema'
import { getUsuario } from '@/lib/dal'
import { createAdminClient } from '@/lib/supabase/admin'

export type TrabajadorState = { error?: string } | null

export async function crearTrabajador(_prev: TrabajadorState, formData: FormData): Promise<TrabajadorState> {
  const u = await getUsuario()
  if (!u || u.rol !== 'jefa') return { error: 'No autorizado.' }

  const nombre = String(formData.get('nombre') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (nombre.length < 2) return { error: 'El nombre es muy corto.' }
  if (!email.includes('@')) return { error: 'Correo inválido.' }
  if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  })
  if (error || !data.user) {
    const msg = error?.message ?? ''
    if (msg.toLowerCase().includes('already')) return { error: 'Ya existe un usuario con ese correo.' }
    return { error: msg || 'No se pudo crear el usuario.' }
  }

  await db.insert(perfiles).values({ id: data.user.id, nombreCompleto: nombre, email })
  await db.insert(miembrosAgencia).values({ agenciaId: u.agenciaId, perfilId: data.user.id, rol: 'empleado' })

  revalidatePath('/trabajadores')
  redirect('/trabajadores')
}

export async function cambiarRol(formData: FormData): Promise<void> {
  const u = await getUsuario()
  if (!u || u.rol !== 'jefa') return
  const miembroId = String(formData.get('miembroId') ?? '')
  const nuevoRol = String(formData.get('rol') ?? '') === 'jefa' ? 'jefa' : 'empleado'
  await db
    .update(miembrosAgencia)
    .set({ rol: nuevoRol })
    .where(and(eq(miembrosAgencia.id, miembroId), eq(miembrosAgencia.agenciaId, u.agenciaId)))
  revalidatePath('/trabajadores')
}

export async function toggleActivo(formData: FormData): Promise<void> {
  const u = await getUsuario()
  if (!u || u.rol !== 'jefa') return
  const miembroId = String(formData.get('miembroId') ?? '')
  const activo = String(formData.get('activo') ?? '') === 'true'
  await db
    .update(miembrosAgencia)
    .set({ activo })
    .where(and(eq(miembrosAgencia.id, miembroId), eq(miembrosAgencia.agenciaId, u.agenciaId)))
  revalidatePath('/trabajadores')
}
