import { config } from 'dotenv'
config({ path: 'platform/app/.env.local' })
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL, { prepare: false })
const tiempos = []
for (let i = 0; i < 6; i++) {
  const a = performance.now()
  await sql`select 1`
  const ms = performance.now() - a
  tiempos.push(ms)
  console.log(`db query ${i}: ${ms.toFixed(0)} ms`)
}
const utiles = tiempos.slice(1) // ignora la primera (conexión)
const prom = utiles.reduce((s, x) => s + x, 0) / utiles.length
console.log(`\nPromedio (sin la 1ra): ${prom.toFixed(0)} ms por consulta`)
await sql.end()
