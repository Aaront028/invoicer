import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { companySettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await db
      .select()
      .from(companySettings)
      .where(eq(companySettings.userId, userId))
      .limit(1)

    return NextResponse.json(settings[0] || null)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Check if settings already exist
    const existing = await db
      .select()
      .from(companySettings)
      .where(eq(companySettings.userId, userId))
      .limit(1)

    if (existing.length > 0) {
      // If settings exist, update them
      await db
        .update(companySettings)
        .set({
          companyName: body.companyName,
          companyAddress: body.companyAddress || null,
          companyEmail: body.companyEmail || null,
          companyPhone: body.companyPhone || null,
        })
        .where(eq(companySettings.userId, userId))

      return NextResponse.json({ ...existing[0], ...body })
    }

    // If no settings exist, create new ones
    const newSettings = {
      id: uuidv4(),
      userId,
      companyName: body.companyName,
      companyAddress: body.companyAddress || null,
      companyEmail: body.companyEmail || null,
      companyPhone: body.companyPhone || null,
    }

    await db.insert(companySettings).values(newSettings)
    return NextResponse.json(newSettings)
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
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

    await db
      .update(companySettings)
      .set({
        companyName: body.companyName,
        companyAddress: body.companyAddress || null,
        companyEmail: body.companyEmail || null,
        companyPhone: body.companyPhone || null,
      })
      .where(eq(companySettings.userId, userId))

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
