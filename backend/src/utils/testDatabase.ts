import sqlite3 from 'sqlite3'
import bcrypt from 'bcryptjs'
import { UserRole } from '../../../shared/enums'
import logger from './logger'

export interface DatabaseUser {
  id: string
  email: string
  password: string
  name: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

class TestDatabase {
  private db: sqlite3.Database | null = null

  constructor() {
    // Use in-memory database for tests
    this.db = new sqlite3.Database(':memory:', err => {
      if (err) {
        logger.error('Error opening test database:', err)
      } else {
        logger.info('Connected to test SQLite database (in-memory)')
        this.initTables()
      }
    })
  }

  private initTables(): void {
    if (!this.db) {
      return
    }

    // Create users table
    this.db.run(
      `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'USER',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      err => {
        if (err) {
          logger.error('Error creating test users table:', err)
        }
      }
    )

    // Create connectors table for future use
    this.db.run(`
      CREATE TABLE IF NOT EXISTS connectors (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        baseUrl TEXT NOT NULL,
        apiKey TEXT,
        clientId TEXT,
        clientSecret TEXT,
        accessToken TEXT,
        refreshToken TEXT,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `)
  }

  public getUserByEmail(
    email: string,
    callback: (err: Error | null, user?: DatabaseUser) => void
  ): void {
    if (!this.db) {
      callback(new Error('Database not initialized'))
      return
    }

    this.db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (err: Error | null, row: unknown) => {
        if (err) {
          callback(err)
        } else {
          callback(null, row as DatabaseUser)
        }
      }
    )
  }

  public getUserById(id: string, callback: (err: Error | null, user?: DatabaseUser) => void): void {
    if (!this.db) {
      callback(new Error('Database not initialized'))
      return
    }

    this.db.get('SELECT * FROM users WHERE id = ?', [id], (err: Error | null, row: unknown) => {
      if (err) {
        callback(err)
      } else {
        callback(null, row as DatabaseUser)
      }
    })
  }

  public createUser(
    user: Omit<DatabaseUser, 'createdAt' | 'updatedAt'>,
    callback: (err: Error | null, userId?: string) => void
  ): void {
    if (!this.db) {
      callback(new Error('Database not initialized'))
      return
    }

    const now = new Date().toISOString()
    this.db.run(
      `INSERT INTO users (id, email, password, name, role, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.email, user.password, user.name, user.role, now, now],
      function (err: Error | null) {
        if (err) {
          callback(err)
        } else {
          callback(null, user.id)
        }
      }
    )
  }

  public updateUser(
    id: string,
    updates: Partial<DatabaseUser>,
    callback: (err: Error | null) => void
  ): void {
    if (!this.db) {
      callback(new Error('Database not initialized'))
      return
    }

    const now = new Date().toISOString()
    const updateFields = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ')
    const values = Object.values(updates)
    values.push(now, id) // Add updatedAt and id for WHERE clause

    this.db.run(`UPDATE users SET ${updateFields}, updatedAt = ? WHERE id = ?`, values, callback)
  }

  public clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve()
        return
      }

      this.db.run('DELETE FROM users', err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve()
        return
      }

      this.db.close(err => {
        if (err) {
          logger.error('Error closing test database:', err)
          reject(err)
        } else {
          logger.info('Test database connection closed')
          this.db = null
          resolve()
        }
      })
    })
  }

  // Helper methods for testing
  public async createTestUser(userData: {
    id: string
    email: string
    password: string
    name: string
    role?: UserRole
  }): Promise<string> {
    const hashedPassword = await bcrypt.hash(userData.password, 10)
    const user: Omit<DatabaseUser, 'createdAt' | 'updatedAt'> = {
      id: userData.id,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      name: userData.name,
      role: userData.role || UserRole.USER,
    }

    return new Promise((resolve, reject) => {
      this.createUser(user, (err, userId) => {
        if (err) {
          reject(err)
        } else {
          resolve(userId!)
        }
      })
    })
  }
}

export default TestDatabase
