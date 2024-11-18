import { NextResponse } from 'next/server'
import { createClient } from '@vercel/postgres'

export async function GET() {
  try {
    console.log('Testing database connection...')

    // Create a new client instance
    const client = createClient()

    // Connect to the database
    await client.connect()

    // Try a simple query
    const result = await client.query('SELECT NOW();')

    // Close the connection
    await client.end()

    console.log('Query successful:', result.rows[0])

    return NextResponse.json({
      success: true,
      timestamp: result.rows[0].now,
      message: 'Database connection successful!',
    })
  } catch (error) {
    console.error('Database connection error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: JSON.stringify(error, null, 2),
      },
      { status: 500 }
    )
  }
}
