import { createClient } from '@supabase/supabase-js'

/**
 * Cliente admin de Supabase (service_role). SOLO servidor — nunca exponer al cliente.
 * Se usa para crear cuentas de usuario desde la sección Trabajadores.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
