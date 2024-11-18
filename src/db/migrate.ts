import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { env } from '@/env'

const pool = new Pool({
  connectionString: env.POSTGRES_URL,
  ssl:
    env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})

const db = drizzle(pool)

async function main() {
  console.log('Migration started...')
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Migration completed!')
  await pool.end()
}

main().catch((err) => {
  console.error('Migration failed!', err)
  process.exit(1)
})
