import DatabaseService from '../database/connection'
import logger from './logger'

export async function initializeDatabase(): Promise<void> {
  try {
    const dbService = DatabaseService.getInstance()
    await dbService.initialize()

    const db = dbService.db

    // Run migrations to create all tables
    logger.info('Running database migrations...')
    await db.migrate.latest()
    logger.info('Database migrations completed')

    // Run seeds to create default data
    logger.info('Running database seeds...')
    await db.seed.run()
    logger.info('Database seeds completed')

    logger.info('Database initialization completed')
  } catch (error) {
    logger.error('Error initializing database:', error)
    throw error
  }
}
