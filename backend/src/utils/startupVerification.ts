import DatabaseService from '../database/connection'
import logger from './logger'
import { UserEntity, ConnectorEntity, ReceiptEntity } from '../database/entities'
import { ensureAdminUserExists, getAdminUserStats } from './adminUserSetup'

/**
 * Verify that all required database tables exist and have the expected structure
 */
export async function verifyDatabaseTables(): Promise<boolean> {
  try {
    const dbService = DatabaseService.getInstance()
    const db = dbService.db

    // List of required tables
    const requiredTables = [
      UserEntity.TABLE_NAME,
      ConnectorEntity.TABLE_NAME,
      ReceiptEntity.TABLE_NAME,
    ]

    logger.info('🔍 Verifying database tables...')

    for (const tableName of requiredTables) {
      const exists = await db.schema.hasTable(tableName)
      if (!exists) {
        logger.error(`❌ Required table '${tableName}' does not exist`)
        return false
      }
      logger.info(`✅ Table '${tableName}' exists`)
    }

    // Verify users table has required columns
    const userColumns = await db(UserEntity.TABLE_NAME).columnInfo()
    const requiredUserColumns = [
      'id',
      'email',
      'password',
      'name',
      'role',
      'created_at',
      'updated_at',
    ]

    for (const column of requiredUserColumns) {
      if (!(column in userColumns)) {
        logger.error(`❌ Required column '${column}' missing from users table`)
        return false
      }
    }

    logger.info('✅ All required database tables and columns exist')
    return true
  } catch (error) {
    logger.error('❌ Database table verification failed:', error)
    return false
  }
}

/**
 * Check migration status and run pending migrations if needed
 */
export async function ensureMigrationsAreApplied(): Promise<boolean> {
  try {
    const dbService = DatabaseService.getInstance()
    const db = dbService.db

    logger.info('🔄 Checking migration status...')

    // Check current migration status
    const [currentBatch] = await db.migrate.currentVersion()
    logger.info(`📊 Current migration batch: ${currentBatch}`)

    // Check for pending migrations
    const pendingMigrations = await db.migrate.list()
    const [, pending] = pendingMigrations

    if (pending.length > 0) {
      logger.warn(`⚠️  Found ${pending.length} pending migrations:`)
      pending.forEach((migration: string) => logger.warn(`   - ${migration}`))

      logger.info('🔄 Running pending migrations...')
      await db.migrate.latest()
      logger.info('✅ All migrations applied successfully')
    } else {
      logger.info('✅ All migrations are up to date')
    }

    return true
  } catch (error) {
    logger.error('❌ Migration check/execution failed:', error)
    return false
  }
}

/**
 * Run database seeds in development mode
 */
export async function runSeedsInDevelopment(): Promise<boolean> {
  try {
    // Only run seeds in development mode
    if (process.env.NODE_ENV !== 'development') {
      logger.info('⏭️  Skipping seeds (not in development mode)')
      return true
    }

    const dbService = DatabaseService.getInstance()
    const db = dbService.db

    logger.info('🌱 Running database seeds for development...')

    // Check if users table already has data
    const userCount = await db(UserEntity.TABLE_NAME).count('* as count').first()
    const currentUserCount = parseInt(userCount?.count as string) || 0

    if (currentUserCount > 0) {
      logger.info(`📊 Found ${currentUserCount} existing users, skipping seed data`)
      return true
    }

    // Run the seeds
    await db.seed.run()
    logger.info('✅ Database seeds completed successfully')

    // Log what was seeded
    const newUserCount = await db(UserEntity.TABLE_NAME).count('* as count').first()
    const seededUserCount = parseInt(newUserCount?.count as string) || 0
    logger.info(`🎯 Seeded ${seededUserCount} users for development`)

    return true
  } catch (error) {
    logger.error('❌ Database seeding failed:', error)
    return false
  }
}

/**
 * Verify database connection and basic functionality
 */
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    const dbService = DatabaseService.getInstance()
    const db = dbService.db

    logger.info('🔌 Testing database connection...')

    // Simple connectivity test
    await db.raw('SELECT 1 as test')
    logger.info('✅ Database connection successful')

    // Test if we can query the users table
    const userCount = await db(UserEntity.TABLE_NAME).count('* as count').first()
    logger.info(`📊 Found ${userCount?.count || 0} users in database`)

    return true
  } catch (error) {
    logger.error('❌ Database connection test failed:', error)
    return false
  }
}

/**
 * Complete database startup verification and initialization
 */
export async function initializeDatabaseOnStartup(): Promise<void> {
  logger.info('🚀 Starting database initialization...')

  try {
    // Initialize the database service
    const dbService = DatabaseService.getInstance()
    await dbService.initialize()

    // Step 1: Verify connection
    const connectionOk = await verifyDatabaseConnection()
    if (!connectionOk) {
      throw new Error('Database connection failed')
    }

    // Step 2: Ensure migrations are applied
    const migrationsOk = await ensureMigrationsAreApplied()
    if (!migrationsOk) {
      throw new Error('Migration verification/execution failed')
    }

    // Step 3: Verify table structure
    const tablesOk = await verifyDatabaseTables()
    if (!tablesOk) {
      throw new Error('Database table verification failed')
    }

    // Step 4: Run seeds in development mode (before admin user setup)
    const seedsOk = await runSeedsInDevelopment()
    if (!seedsOk) {
      logger.warn('⚠️  Database seeding failed, continuing anyway...')
    }

    // Step 5: Ensure admin user exists (from environment variables)
    await ensureAdminUserExists()

    // Step 6: Verify admin user setup and provide status
    const adminStats = await getAdminUserStats()
    if (adminStats.adminCount === 0) {
      logger.warn('⚠️  No admin users found in database')
      logger.warn('⚠️  Please check ADMIN_EMAIL and ADMIN_PASSWORD environment variables')
    } else {
      logger.info(`✅ Found ${adminStats.adminCount} admin user(s) in database`)
      if (adminStats.hasDefaultAdmin) {
        logger.info('✅ Default admin user is configured and exists')
      }
    }

    logger.info(`📊 Total users in database: ${adminStats.totalUsers}`)
    logger.info('🎉 Database initialization completed successfully')
  } catch (error) {
    logger.error('💥 Database initialization failed:', error)
    logger.error('🔧 Possible solutions:')
    logger.error('   1. Check database file permissions')
    logger.error('   2. Verify migration files are present')
    logger.error('   3. Run migrations manually: npm run migrate:latest')
    logger.error('   4. Check database configuration in knexfile.ts')
    logger.error('   5. Verify ADMIN_EMAIL and ADMIN_PASSWORD environment variables')

    // In production, we should fail fast if database is not working
    if (process.env.NODE_ENV === 'production') {
      logger.error('🚫 Shutting down due to database initialization failure in production')
      process.exit(1)
    } else {
      logger.warn('⚠️  Development mode: continuing despite database issues')
      throw error
    }
  }
}

/**
 * Quick health check for database (used by health endpoint)
 */
export async function getDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy'
  details: {
    connected: boolean
    tablesExist: boolean
    userCount: number
    adminCount: number
    hasDefaultAdmin: boolean
  }
}> {
  try {
    const dbService = DatabaseService.getInstance()
    const db = dbService.db

    // Test connection
    await db.raw('SELECT 1')
    const connected = true

    // Check if users table exists
    const tablesExist = await db.schema.hasTable(UserEntity.TABLE_NAME)

    // Get user count and admin stats if table exists
    let userCount = 0
    let adminCount = 0
    let hasDefaultAdmin = false

    if (tablesExist) {
      const adminStats = await getAdminUserStats()
      userCount = adminStats.totalUsers
      adminCount = adminStats.adminCount
      hasDefaultAdmin = adminStats.hasDefaultAdmin
    }

    const isHealthy = connected && tablesExist && userCount >= 0

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      details: {
        connected,
        tablesExist,
        userCount,
        adminCount,
        hasDefaultAdmin,
      },
    }
  } catch (error) {
    logger.error('Database health check failed:', error)
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        tablesExist: false,
        userCount: 0,
        adminCount: 0,
        hasDefaultAdmin: false,
      },
    }
  }
}
