import { defineConfig } from 'drizzle-kit'
import env from './src/middleware/utils/runtime-env'
import 'dotenv/config'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
