'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Invoice } from '@/db/schema'
import { useUser } from "@clerk/nextjs"

export default function InvoiceHistory() {
  const { user } = useUser()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return

      try {
        const response = await fetch('/api/invoices')
        if (response.ok) {
          const data = await response.json()
          setInvoices(data)
        }
      } catch (error) {
        console.error('Failed to fetch invoices:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchInvoices()
    }
  }, [user])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Invoice #{invoice.invoiceNumber}</h3>
                    <p className="text-sm text-gray-600">Due: {invoice.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${invoice.total}</p>
                    <span className="text-sm px-2 py-1 rounded-full bg-gray-100">
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}