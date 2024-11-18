import type { Config } from 'drizzle-kit'

console.log('POSTGRES_URL:', process.env.POSTGRES_URL)

const config: Config = {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL || '',
  },
}

export default config
