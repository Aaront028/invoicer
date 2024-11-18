import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import path from 'path'
import { db } from '@/db'
import { clients, companySettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'

interface LineItem {
  description: string
  quantity: number
  price: number
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invoiceNumber, selectedClient, dueDate, lineItems } =
      await req.json()

    // Get company settings
    const settings = await db
      .select()
      .from(companySettings)
      .where(eq(companySettings.userId, userId))
      .limit(1)

    // Get client details
    const clientDetails = await db
      .select()
      .from(clients)
      .where(eq(clients.id, selectedClient))
      .limit(1)

    if (!clientDetails.length) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const client = clientDetails[0]
    const company = settings[0] || {
      companyName: 'Your Company Name',
      companyAddress: '123 Business Street',
      companyEmail: 'contact@yourcompany.com',
      companyPhone: '+1 (555) 123-4567',
    }

    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      font: null, // Disable default font initialization
    })

    // Get the absolute path to the Roboto font file
    const fontPath = path.join(
      process.cwd(),
      'src',
      'fonts',
      'Roboto-Regular.ttf'
    )

    // Register and use the Roboto font
    doc.registerFont('Roboto', fontPath)
    doc.font('Roboto')

    const buffers: Buffer[] = []
    doc.on('data', (chunk) => buffers.push(Buffer.from(chunk)))

    // Colors
    const primaryColor = '#2563eb'
    const textColor = '#1f2937'
    const lightGray = '#f3f4f6'

    // Company header
    doc
      .fontSize(24)
      .fillColor(primaryColor)
      .text(company.companyName, 50, 50, { align: 'right' })
      .fontSize(10)
      .fillColor(textColor)
      .text(company.companyAddress || '', { align: 'right' })
      .text(company.companyEmail || '', { align: 'right' })
      .text(company.companyPhone || '', { align: 'right' })

    // Invoice title and number
    doc
      .fontSize(32)
      .fillColor(primaryColor)
      .text('INVOICE', 50, 50)
      .fontSize(12)
      .fillColor(textColor)
      .text(`#${invoiceNumber}`)

    // Client information
    doc
      .fontSize(12)
      .text('Bill To:', 50, 150)
      .fontSize(14)
      .text(client.name, 50, 170)
      .fontSize(12)
      .text(client.address || '', 50, 190)
      .text(client.email || '', 50, 210)
      .text(client.phone || '', 50, 230)
      .text(`Due Date: ${dueDate}`, 50, 250)

    // Line items table
    const tableTop = 300
    const itemX = 50
    const quantityX = 350
    const priceX = 400
    const totalX = 480

    // Table headers
    doc
      .fontSize(10)
      .fillColor(primaryColor)
      .text('Item', itemX, tableTop)
      .text('Qty', quantityX, tableTop)
      .text('Price', priceX, tableTop)
      .text('Total', totalX, tableTop)

    // Line items
    let position = tableTop + 30
    lineItems.forEach((item: LineItem, index: number) => {
      const itemTotal = item.quantity * item.price

      if (index % 2 === 0) {
        doc
          .fillColor(lightGray)
          .rect(50, position - 10, 500, 25)
          .fill()
      }

      doc
        .fillColor(textColor)
        .text(item.description, itemX, position)
        .text(item.quantity.toString(), quantityX, position)
        .text(`$${item.price.toFixed(2)}`, priceX, position)
        .text(`$${itemTotal.toFixed(2)}`, totalX, position)

      position += 30
    })

    // Calculate and add total
    const total = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    )
    doc
      .moveDown(2)
      .fontSize(14)
      .fillColor(primaryColor)
      .text(`Total: $${total.toFixed(2)}`, { align: 'right' })

    // Finalize PDF
    doc.end()

    return new Promise<NextResponse>((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(
          new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="invoice-${invoiceNumber}.pdf"`,
            },
          })
        )
      })
    })
  } catch (error) {
    console.error('PDF Generation Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
