import { UserRepository } from '../database/repositories/UserRepository'
import DatabaseService from '../database/connection'
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

// Backward compatibility adapter
class DatabaseAdapter {
  private readonly userRepository: UserRepository

  // Helper function to safely convert to ISO string
  private safeToISOString(date: any): string {
    if (!date) return new Date().toISOString()
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
    }
    // If it's a string, try to parse it
    try {
      const parsedDate = new Date(date)
      return isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  constructor() {
    this.userRepository = new UserRepository(DatabaseService.getInstance().db)
  }

  // Initialize database (for backward compatibility)
  async init(): Promise<void> {
    await DatabaseService.getInstance().initialize()
  }

  // Backward compatible getUserByEmail method
  getUserByEmail(email: string, callback: (err: Error | null, user: DatabaseUser | null) => void): void {
    this.userRepository.findByEmail(email)
      .then(user => {
        if (user) {
          const dbUser: DatabaseUser = {
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            role: user.role,
            createdAt: this.safeToISOString(user.createdAt),
            updatedAt: this.safeToISOString(user.updatedAt)
          }
          callback(null, dbUser)
        } else {
          callback(null, null)
        }
      })
      .catch(err => {
        logger.error('Error getting user by email:', err)
        callback(err, null)
      })
  }

  // Backward compatible getUserById method
  getUserById(id: string, callback: (err: Error | null, user: DatabaseUser | null) => void): void {
    this.userRepository.findById(id)
      .then(user => {
        if (user) {
          const dbUser: DatabaseUser = {
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : new Date().toISOString()
          }
          callback(null, dbUser)
        } else {
          callback(null, null)
        }
      })
      .catch(err => {
        logger.error('Error getting user by id:', err)
        callback(err, null)
      })
  }

  // Backward compatible createUser method
  createUser(user: Omit<DatabaseUser, 'createdAt' | 'updatedAt'>, callback: (err: Error | null, user?: DatabaseUser) => void): void {
    this.userRepository.create({
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role
    })
      .then(userId => {
        // Return the created user
        return this.userRepository.findById(userId)
      })
      .then(createdUser => {
        if (createdUser) {
          const dbUser: DatabaseUser = {
            id: createdUser.id,
            email: createdUser.email,
            password: createdUser.password,
            name: createdUser.name,
            role: createdUser.role,
            createdAt: this.safeToISOString(createdUser.createdAt),
            updatedAt: this.safeToISOString(createdUser.updatedAt)
          }
          callback(null, dbUser)
        } else {
          callback(new Error('User was created but could not be retrieved'))
        }
      })
      .catch(err => {
        logger.error('Error creating user:', err)
        callback(err)
      })
  }

  // Backward compatible updateUser method
  updateUser(id: string, updates: Partial<Omit<DatabaseUser, 'id' | 'createdAt' | 'updatedAt'>>, callback: (err: Error | null) => void): void {
    this.userRepository.update(id, {
      email: updates.email,
      password: updates.password,
      name: updates.name,
      role: updates.role
    })
      .then(() => {
        callback(null)
      })
      .catch(err => {
        logger.error('Error updating user:', err)
        callback(err)
      })
  }

  // Close database connection
  close(callback?: (err: Error | null) => void): void {
    DatabaseService.getInstance().close()
      .then(() => {
        if (callback) callback(null)
      })
      .catch(err => {
        logger.error('Error closing database:', err)
        if (callback) callback(err)
      })
  }
}

const database = new DatabaseAdapter()
export default database
