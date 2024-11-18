import { db } from '@/db'
import { clients, type NewClient } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getClientsByUserId(userId: string) {
  return await db.query.clients.findMany({
    where: eq(clients.userId, userId),
  })
}

export async function createClient(client: NewClient) {
  return await db.insert(clients).values(client)
}

export async function updateClient(id: string, client: Partial<NewClient>) {
  return await db.update(clients).set(client).where(eq(clients.id, id))
}

export async function deleteClient(id: string) {
  return await db.delete(clients).where(eq(clients.id, id))
}
