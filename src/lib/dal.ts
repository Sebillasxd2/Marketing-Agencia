import { cache } from 'react'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { miembrosAgencia, perfiles } from '@/db/schema'

export type Rol = 'jefa' | 'empleado'
export type UsuarioActual = {
  id: string
  email: string
  nombre: string
  rol: Rol
  agenciaId: string
}

/** Usuario autenticado + su rol/agencia. Memoizado por request con React.cache. */
export const getUsuario = cache(async (): Promise<UsuarioActual | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const rows = await db
    .select({
      nombre: perfiles.nombreCompleto,
      rol: miembrosAgencia.rol,
      agenciaId: miembrosAgencia.agenciaId,
    })
    .from(miembrosAgencia)
    .innerJoin(perfiles, eq(perfiles.id, miembrosAgencia.perfilId))
    .where(eq(miembrosAgencia.perfilId, user.id))
    .limit(1)

  const m = rows[0]
  if (!m) return null

  return { id: user.id, email: user.email ?? '', nombre: m.nombre, rol: m.rol, agenciaId: m.agenciaId }
})

/** Exige sesión (y opcionalmente un rol). Redirige si no cumple. */
export const requireUsuario = cache(async (rol?: Rol): Promise<UsuarioActual> => {
  const u = await getUsuario()
  if (!u) redirect('/login')
  if (rol && u.rol !== rol) redirect(u.rol === 'jefa' ? '/jefa' : '/empleado')
  return u
})
