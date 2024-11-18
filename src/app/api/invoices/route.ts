import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { invoices, invoiceItems } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))

    return NextResponse.json(userInvoices)
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
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
    const { clientId, invoiceNumber, dueDate, lineItems } = body

    if (!clientId || !invoiceNumber || !lineItems?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate total from line items
    const total = lineItems.reduce(
      (sum: number, item: { quantity: number; price: number }) =>
        sum + item.quantity * item.price,
      0
    )

    // Create invoice
    const invoiceId = uuidv4()
    await db.insert(invoices).values({
      id: invoiceId,
      userId,
      clientId,
      invoiceNumber,
      dueDate,
      total,
      status: 'draft',
    })

    // Create invoice items
    const itemsToInsert = lineItems.map((item: any) => ({
      id: uuidv4(),
      invoiceId,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
    }))

    await db.insert(invoiceItems).values(itemsToInsert)

    return NextResponse.json({ id: invoiceId })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
