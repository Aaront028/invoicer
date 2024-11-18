import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

console.log('Attempting to connect with URL:', process.env.POSTGRES_URL)

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : undefined,
})

// Test the connection and check tables
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err)
    return
  }
  console.log('Successfully connected to database')

  if (client) {
    try {
      // List all tables
      const tables = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `)
      console.log(
        'Available tables:',
        tables.rows.map((row) => row.table_name)
      )

      // Check users table structure
      const userColumns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'users'
      `)
      console.log('Users table structure:', userColumns.rows)
    } catch (error) {
      console.error('Error checking tables:', error)
    } finally {
      release()
    }
  }
})

export const db = drizzle(pool, { schema })
