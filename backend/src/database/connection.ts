import knex, { Knex } from 'knex'
import config from './knexfile'
import logger from '../utils/logger'

class DatabaseService {
  private static instance: DatabaseService
  private readonly _db: Knex
  private _initialized = false

  private constructor() {
    const environment = process.env.NODE_ENV || 'development'
    this._db = knex(config[environment])
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  public get db(): Knex {
    return this._db
  }

  public async initialize(): Promise<void> {
    if (this._initialized) return

    try {
      // Ensure data directory exists
      if (process.env.NODE_ENV !== 'test') {
        const fs = await import('fs')
        const path = await import('path')
        const dataDir = path.join(__dirname, '../data')
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true })
        }
      }

      // Run migrations
      await this._db.migrate.latest()
      logger.info('Database migrations completed successfully')

      // Run seeds in development
      if (process.env.NODE_ENV === 'development') {
        await this._db.seed.run()
        logger.info('Database seeds completed successfully')
      }

      this._initialized = true
    } catch (error) {
      logger.error('Database initialization failed:', error)
      throw error
    }
  }

  public async runMigrations(): Promise<void> {
    try {
      await this._db.migrate.latest()
      logger.info('Migrations completed successfully')
    } catch (error) {
      logger.error('Migration failed:', error)
      throw error
    }
  }

  public async rollbackMigration(): Promise<void> {
    try {
      await this._db.migrate.rollback()
      logger.info('Migration rollback completed successfully')
    } catch (error) {
      logger.error('Migration rollback failed:', error)
      throw error
    }
  }

  public async close(): Promise<void> {
    try {
      await this._db.destroy()
      logger.info('Database connection closed')
    } catch (error) {
      logger.error('Error closing database connection:', error)
      throw error
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this._db.raw('SELECT 1')
      return true
    } catch (error) {
      logger.error('Database connection test failed:', error)
      return false
    }
  }
}

export default DatabaseService
