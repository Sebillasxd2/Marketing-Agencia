import { createAdminClient } from '@/lib/supabase/admin'

export const BUCKET = 'contenido'

/** Genera URLs firmadas (temporales) para rutas privadas del bucket. */
export async function urlsFirmadas(paths: string[], ttl = 3600): Promise<Record<string, string>> {
  const limpios = paths.filter((p): p is string => !!p)
  if (limpios.length === 0) return {}
  const admin = createAdminClient()
  const { data } = await admin.storage.from(BUCKET).createSignedUrls(limpios, ttl)
  const map: Record<string, string> = {}
  for (const d of data ?? []) {
    if (d.path && d.signedUrl) map[d.path] = d.signedUrl
  }
  return map
}
