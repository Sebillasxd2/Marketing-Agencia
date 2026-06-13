import { cache } from 'react'
import { redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
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
  // getSession() lee la sesión desde la cookie localmente (rápido, sin viaje de red);
  // el proxy ya refrescó/escribió la cookie. Para producción multi-tenant con usuarios
  // no confiables, volver a getUser() (validación en el servidor de auth).
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return null

  const rows = await db
    .select({
      nombre: perfiles.nombreCompleto,
      rol: miembrosAgencia.rol,
      agenciaId: miembrosAgencia.agenciaId,
    })
    .from(miembrosAgencia)
    .innerJoin(perfiles, eq(perfiles.id, miembrosAgencia.perfilId))
    .where(and(eq(miembrosAgencia.perfilId, user.id), eq(miembrosAgencia.activo, true)))
    .limit(1)

  const m = rows[0]
  if (!m) return null

  return { id: user.id, email: user.email ?? '', nombre: m.nombre, rol: m.rol, agenciaId: m.agenciaId }
})

/** Exige sesión (y opcionalmente un rol). Redirige si no cumple. */
export const requireUsuario = cache(async (rol?: Rol): Promise<UsuarioActual> => {
  const u = await getUsuario()
  if (!u) redirect('/login')
  if (rol && u.rol !== rol) redirect('/dashboard')
  return u
})
