import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import DatabaseService from '../database/connection'
import { UserRepository } from '../database/repositories/UserRepository'
import { UserRole } from '../../../shared/enums'
import logger from './logger'

/**
 * Create initial admin user from environment variables if it doesn't exist
 */
export async function ensureAdminUserExists(): Promise<void> {
  try {
    // Get admin user configuration from environment
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD
    const adminName = process.env.ADMIN_NAME || 'System Administrator'

    if (!adminEmail || !adminPassword) {
      logger.warn('⚠️  Admin user environment variables not set (ADMIN_EMAIL, ADMIN_PASSWORD)')
      logger.warn('⚠️  Skipping admin user creation')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(adminEmail)) {
      logger.error(`❌ Invalid admin email format: ${adminEmail}`)
      return
    }

    // Validate password strength
    if (adminPassword.length < 6) {
      logger.error('❌ Admin password must be at least 6 characters long')
      return
    }

    const dbService = DatabaseService.getInstance()
    const userRepository = new UserRepository(dbService.db)

    logger.info(`🔍 Checking if admin user exists: ${adminEmail}`)

    // Check if admin user already exists
    const existingUser = await userRepository.findByEmail(adminEmail.toLowerCase())

    if (existingUser) {
      logger.info(`✅ Admin user already exists: ${adminEmail}`)

      // Check if user has admin role
      if (existingUser.role !== UserRole.ADMIN) {
        logger.warn(
          `⚠️  User ${adminEmail} exists but is not an admin (role: ${existingUser.role})`
        )

        // In development mode, automatically upgrade user to admin
        if (process.env.NODE_ENV !== 'production') {
          logger.info(`🔧 Development mode: upgrading user ${adminEmail} to ADMIN role`)

          const upgraded = await userRepository.update(existingUser.id, {
            role: UserRole.ADMIN,
            updatedAt: new Date(),
          })

          if (upgraded) {
            logger.info(`✅ User ${adminEmail} has been upgraded to ADMIN role`)
          } else {
            logger.error(`❌ Failed to upgrade user ${adminEmail} to ADMIN role`)
          }
        } else {
          logger.warn('⚠️  Consider updating user role manually or using a different admin email')
        }
      } else {
        logger.info(`✅ Admin user has correct ADMIN role`)
      }
      return
    }

    logger.info(`🔨 Creating admin user: ${adminEmail}`)

    // Hash the password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10)
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds)

    // Create admin user
    const adminUserId = await userRepository.create({
      id: uuidv4(),
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      name: adminName,
      role: UserRole.ADMIN,
    })

    logger.info(`🎉 Admin user created successfully`)
    logger.info(`   - ID: ${adminUserId}`)
    logger.info(`   - Email: ${adminEmail}`)
    logger.info(`   - Name: ${adminName}`)
    logger.info(`   - Role: ${UserRole.ADMIN}`)

    // Security note
    if (process.env.NODE_ENV === 'production') {
      logger.warn('🔒 SECURITY REMINDER: Change the default admin password after first login!')
    }
  } catch (error) {
    logger.error('❌ Error creating admin user:', error)
    throw error
  }
}

/**
 * Get admin user statistics for health checks
 */
export async function getAdminUserStats(): Promise<{
  adminCount: number
  totalUsers: number
  hasDefaultAdmin: boolean
}> {
  try {
    const dbService = DatabaseService.getInstance()
    const userRepository = new UserRepository(dbService.db)

    // Count total users
    const totalUsers = await userRepository.count()

    // Count admin users
    const db = dbService.db
    const adminResult = await db('users').where('role', UserRole.ADMIN).count('* as count').first()
    const adminCount = (adminResult?.count as number) || 0

    // Check if default admin exists
    const defaultAdminEmail = process.env.ADMIN_EMAIL
    const hasDefaultAdmin = defaultAdminEmail
      ? await userRepository.exists(defaultAdminEmail.toLowerCase())
      : false

    return {
      adminCount,
      totalUsers,
      hasDefaultAdmin,
    }
  } catch (error) {
    logger.error('Error getting admin user stats:', error)
    return {
      adminCount: 0,
      totalUsers: 0,
      hasDefaultAdmin: false,
    }
  }
}
