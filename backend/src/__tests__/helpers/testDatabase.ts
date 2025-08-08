import DatabaseService from '../../database/connection'
import { initializeDatabase } from '../../utils/initDatabase'

export async function setupTestDatabase(): Promise<void> {
  process.env.NODE_ENV = 'test'
  await initializeDatabase()
}

export async function cleanupTestDatabase(): Promise<void> {
  const dbService = DatabaseService.getInstance()
  const db = dbService.db

  // Clean up all tables
  if (await db.schema.hasTable('receipts')) {
    await db('receipts').del()
  }
  if (await db.schema.hasTable('connectors')) {
    await db('connectors').del()
  }
  if (await db.schema.hasTable('users')) {
    await db('users').del()
  }
}

export async function closeTestDatabase(): Promise<void> {
  await DatabaseService.getInstance().close()
}
