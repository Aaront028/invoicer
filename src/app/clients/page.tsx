'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Client } from '@/db/schema'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { useUser } from "@clerk/nextjs"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isAddingClient, setIsAddingClient] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      setError('Failed to fetch clients')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const response = await fetch('/api/clients', {
        method: editingClient ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingClient ? { ...formData, id: editingClient.id } : formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || data.message || 'Failed to save client')
        console.error('Server error details:', data)
        return
      }

      setFormData({ name: '', email: '', address: '', phone: '' })
      setIsAddingClient(false)
      setEditingClient(null)
      fetchClients()
    } catch (error) {
      console.error('Client operation failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to save client')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchClients()
      }
    } catch (error) {
      setError('Failed to delete client')
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email || '',
      address: client.address || '',
      phone: client.phone || '',
    })
    setIsAddingClient(true)
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clients</CardTitle>
          <Button onClick={() => setIsAddingClient(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Client
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {isAddingClient && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsAddingClient(false)
                  setEditingClient(null)
                  setFormData({ name: '', email: '', address: '', phone: '' })
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingClient ? 'Update' : 'Add'} Client
                </Button>
              </div>
            </form>
          )}

          <div className="divide-y">
            {clients.map((client) => (
              <div key={client.id} className="py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{client.name}</h3>
                  {client.email && <p className="text-sm text-gray-600">{client.email}</p>}
                  {client.phone && <p className="text-sm text-gray-600">{client.phone}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}