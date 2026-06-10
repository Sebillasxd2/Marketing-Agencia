import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/** Cliente Supabase para el servidor (Server Components, Server Actions, Route Handlers). */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Llamado desde un Server Component (no puede escribir cookies):
            // el `proxy` se encarga de refrescar la sesión. Ignorar.
          }
        },
      },
    },
  )
}
