import sqlite3 from 'sqlite3'
import path from 'path'
import { mkdir } from 'fs/promises'

export async function initializeSimpleDatabase(): Promise<void> {
  // Create data directory
  const dataDir = path.join(__dirname, '../data')
  await mkdir(dataDir, { recursive: true })
  
  const dbPath = path.join(dataDir, 'recipix.db')
  
  const db = new sqlite3.Database(dbPath)
  
  try {
    await new Promise<void>((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT DEFAULT 'USER',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
            reject(err)
        } else {
            resolve()
        }
      })
    })
  } finally {
    await new Promise<void>((resolve) => {
      db.close(() => resolve())
    })
  }
}
