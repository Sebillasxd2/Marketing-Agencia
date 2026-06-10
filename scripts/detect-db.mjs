// Detecta la connection string de Postgres correcta para el proyecto Supabase,
// probando: conexión directa + pooler (session 5432 / transaction 6543) en varias regiones.
// El password se pasa por env PW para no quemarlo en el archivo.
import postgres from 'postgres'

const pw = process.env.PW
const ref = process.env.REF
if (!pw || !ref) {
  console.log('Falta PW o REF en el entorno.')
  process.exit(2)
}

const regions = ['sa-east-1', 'us-east-1', 'us-east-2', 'us-west-1', 'eu-central-1']
const candidates = [
  ['directo', `postgresql://postgres:${pw}@db.${ref}.supabase.co:5432/postgres`],
]
for (const r of regions) {
  for (const aws of ['aws-0', 'aws-1']) {
    candidates.push([`session ${aws}-${r}`, `postgresql://postgres.${ref}:${pw}@${aws}-${r}.pooler.supabase.com:5432/postgres`])
    candidates.push([`transaction ${aws}-${r}`, `postgresql://postgres.${ref}:${pw}@${aws}-${r}.pooler.supabase.com:6543/postgres`])
  }
}

for (const [name, url] of candidates) {
  const sql = postgres(url, { prepare: false, connect_timeout: 6, max: 1, idle_timeout: 1 })
  try {
    await sql`select 1 as ok`
    console.log('OK   ::', name)
    console.log('WORKING_URL=' + url)
    try { await sql.end({ timeout: 1 }) } catch {}
    process.exit(0)
  } catch (e) {
    console.log('fail ::', name, '::', e.code || (e.message || '').slice(0, 60))
    try { await sql.end({ timeout: 1 }) } catch {}
  }
}
console.log('NONE_WORKED')
process.exit(1)
