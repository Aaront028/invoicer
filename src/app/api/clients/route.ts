import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, clients } from '@/db/schema'
import { auth, currentUser } from '@clerk/nextjs/server'
import { v4 as uuidv4 } from 'uuid'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userClients = await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId))
    return NextResponse.json(userClients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    console.log('Received request body:', body)

    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // First ensure user exists
    try {
      console.log('Attempting to insert user:', {
        id: userId,
        email: user.emailAddresses[0]?.emailAddress,
        name:
          `${user.firstName} ${user.lastName}`.trim() || user.username || '',
      })

      const result = await db
        .insert(users)
        .values({
          id: userId,
          email: user.emailAddresses[0]?.emailAddress || '',
          name:
            `${user.firstName} ${user.lastName}`.trim() || user.username || '',
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: user.emailAddresses[0]?.emailAddress || '',
            name:
              `${user.firstName} ${user.lastName}`.trim() ||
              user.username ||
              '',
          },
        })
        .returning()

      console.log('User insert/update result:', result)

      // Then create the client
      const newClient = {
        id: uuidv4(),
        userId,
        name: body.name,
        email: body.email || null,
        address: body.address || null,
        phone: body.phone || null,
      }

      console.log('Attempting to insert client:', newClient)

      await db.insert(clients).values(newClient)

      return NextResponse.json(newClient)
    } catch (dbError) {
      console.error('Database operation failed:', dbError)
      return NextResponse.json(
        {
          error: 'Database operation failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown error',
          stack: dbError instanceof Error ? dbError.stack : undefined,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/clients:', error)
    return NextResponse.json(
      {
        error: 'Failed to create client',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    await db
      .update(clients)
      .set({
        name: updateData.name,
        email: updateData.email || null,
        address: updateData.address || null,
        phone: updateData.phone || null,
      })
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))

    const updatedClient = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .limit(1)

    return NextResponse.json(updatedClient[0])
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}
