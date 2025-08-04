import sqlite3 from 'sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import logger from './logger'
import { UserRole } from '../../../shared/enums'

export interface DatabaseUser {
  id: string
  email: string
  password: string
  name: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

class Database {
  private readonly db: sqlite3.Database

  constructor() {
    const dbPath = path.join(__dirname, '../../data/recipix.db')
    this.db = new sqlite3.Database(dbPath, err => {
      if (err) {
        logger.error('Error opening database:', err)
      } else {
        logger.info('Connected to SQLite database')
        this.initTables()
      }
    })
  }

  private initTables(): void {
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
          logger.error('Error creating users table:', err)
        } else {
          // Check if we need to create default admin user
          this.createDefaultUsers()
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

  private createDefaultUsers(): void {
    this.getUserByEmail('admin@recipix.com', (err, user) => {
      if (err || !user) {
        // Create default admin user
        const adminUser: Omit<DatabaseUser, 'createdAt' | 'updatedAt'> = {
          id: 'admin-1',
          email: 'admin@recipix.com',
          password: bcrypt.hashSync('admin123', 10),
          name: 'Admin User',
          role: UserRole.ADMIN,
        }
        this.createUser(adminUser, () => {
          logger.info('Created default admin user: admin@recipix.com / admin123')
        })
      }
    })

    this.getUserByEmail('user@recipix.com', (err, user) => {
      if (err || !user) {
        // Create default regular user
        const regularUser: Omit<DatabaseUser, 'createdAt' | 'updatedAt'> = {
          id: 'user-1',
          email: 'user@recipix.com',
          password: bcrypt.hashSync('user123', 10),
          name: 'Regular User',
          role: UserRole.USER,
        }
        this.createUser(regularUser, () => {
          logger.info('Created default user: user@recipix.com / user123')
        })
      }
    })
  }

  public getUserByEmail(
    email: string,
    callback: (err: Error | null, user?: DatabaseUser) => void
  ): void {
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
    const now = new Date().toISOString()
    const updateFields = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ')
    const values = Object.values(updates)
    values.push(now, id) // Add updatedAt and id for WHERE clause

    this.db.run(`UPDATE users SET ${updateFields}, updatedAt = ? WHERE id = ?`, values, callback)
  }

  public close(): void {
    this.db.close(err => {
      if (err) {
        logger.error('Error closing database:', err)
      } else {
        logger.info('Database connection closed')
      }
    })
  }
}

// Create a singleton instance
const database = new Database()

export default database
