import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit no lee .env.local automáticamente; lo cargamos a mano.
config({ path: '.env.local' })

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
