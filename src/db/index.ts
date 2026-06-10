import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Falta DATABASE_URL en .env.local (connection string de Supabase → Database).')
}

// Supabase usa pgBouncer en el pooler → prepare:false. Una sola conexión reutilizable.
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })
