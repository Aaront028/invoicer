'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from 'lucide-react'
import { Client } from '@/db/schema'
import { useUser } from "@clerk/nextjs"

interface LineItem {
  description: string;
  quantity: number;
  price: number;
}

export default function CreateInvoice() {
  const { user } = useUser();
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [selectedClient, setSelectedClient] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, price: 0 }
  ]);
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/clients')
        if (response.ok) {
          const data = await response.json()
          setClients(data)
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchClients()
    }
  }, [user])

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, price: 0 }])
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const updatedItems = lineItems.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value }
      }
      return item
    })
    setLineItems(updatedItems)
  }

  const calculateTotal = () => {
    return lineItems.reduce((total, item) => total + (item.quantity * item.price), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      // First, save the invoice to the database
      const invoiceResponse = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClient,
          invoiceNumber,
          dueDate,
          lineItems
        }),
      })

      if (!invoiceResponse.ok) {
        throw new Error('Failed to save invoice')
      }

      // Then generate the PDF
      const pdfResponse = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceNumber,
          selectedClient,
          dueDate,
          lineItems
        }),
      })

      if (pdfResponse.ok) {
        const blob = await pdfResponse.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoiceNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        // Clear form after successful save and PDF generation
        setInvoiceNumber('')
        setSelectedClient('')
        setDueDate('')
        setLineItems([{ description: '', quantity: 1, price: 0 }])
      } else {
        setError('Failed to generate PDF')
      }
    } catch (error) {
      setError('Error processing invoice')
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div>Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create Invoice</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Line Items</Label>
            {lineItems.map((item, index) => (
              <div key={index} className="flex items-end space-x-2">
                <Input
                  value={item.description}
                  onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="flex-grow"
                />
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value))}
                  placeholder="Qty"
                  className="w-20"
                />
                <Input
                  type="number"
                  value={item.price}
                  onChange={(e) => updateLineItem(index, 'price', parseFloat(e.target.value))}
                  placeholder="Price"
                  className="w-24"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addLineItem}>
              Add Line Item
            </Button>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">Total: ${calculateTotal().toFixed(2)}</p>
          </div>
          {error && <p className="text-red-500">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="ml-auto">Create Invoice</Button>
        </CardFooter>
      </form>
    </Card>
  )
}