'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Invoice, InvoiceItem } from '@/db/schema'
import { useUser } from "@clerk/nextjs"

interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

export default function InvoiceDetails({ params }: { params: { id: string } }) {
  const { user } = useUser()
  const [invoice, setInvoice] = useState<InvoiceWithItems | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/invoices/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setInvoice(data)
        }
      } catch (error) {
        setError('Failed to fetch invoice')
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchInvoice()
    }
  }, [user, params.id])

  const regeneratePDF = async () => {
    if (!invoice) return

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceNumber: invoice.invoiceNumber,
          clientId: invoice.clientId,
          dueDate: invoice.dueDate,
          lineItems: invoice.items,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoice.invoiceNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      setError('Failed to regenerate PDF')
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!invoice) return <div>Invoice not found</div>

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Invoice #{invoice.invoiceNumber}</CardTitle>
          <Button onClick={regeneratePDF}>Regenerate PDF</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold">Details</h3>
              <p>Due Date: {invoice.dueDate}</p>
              <p>Status: {invoice.status}</p>
              <p>Total: ${invoice.total}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Line Items</h3>
              <div className="space-y-2">
                {invoice.items.map((item) => (
                  <div key={item.id} className="flex justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity} × ${item.price}
                      </p>
                    </div>
                    <p className="font-medium">
                      ${(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}