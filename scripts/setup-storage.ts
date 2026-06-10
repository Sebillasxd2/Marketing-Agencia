/** Crea el bucket privado 'contenido' en Supabase Storage. Idempotente. */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const { data: buckets, error } = await admin.storage.listBuckets()
  if (error) throw error
  if (buckets?.some((b) => b.name === 'contenido')) {
    console.log('Bucket "contenido" ya existe ✓')
    return
  }
  const { error: e2 } = await admin.storage.createBucket('contenido', {
    public: false,
    fileSizeLimit: '50MB',
  })
  if (e2) throw e2
  console.log('Bucket "contenido" creado (privado) ✓')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
