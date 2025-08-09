import { Router, Request, Response } from 'express'
import logger from '../utils/logger'
import { getDatabaseHealth } from '../utils/startupVerification'
import packageJson from '../../package.json'

const router = Router()

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: packageJson.version,
    },
  })
})

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with dependencies
 * @access  Public
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    // Check database health
    const dbHealth = await getDatabaseHealth()

    const healthCheck = {
      status: dbHealth.status === 'healthy' ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: packageJson.version,
      dependencies: {
        database: {
          status: dbHealth.status,
          details: {
            connected: dbHealth.details.connected,
            tablesExist: dbHealth.details.tablesExist,
            userCount: dbHealth.details.userCount,
            adminCount: dbHealth.details.adminCount,
            hasDefaultAdmin: dbHealth.details.hasDefaultAdmin,
          },
        },
        firefly: 'unknown', // Will be checked dynamically
        ocr: 'available', // Tesseract is bundled
      },
    }

    const statusCode = dbHealth.status === 'healthy' ? 200 : 503

    res.status(statusCode).json({
      success: dbHealth.status === 'healthy',
      data: healthCheck,
    })
  } catch (error) {
    // Log the error using Winston or your logger
    logger.error('Detailed health check failed:', error)

    res.status(503).json({
      success: false,
      error: 'Service unavailable',
      data: {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: packageJson.version,
        dependencies: {
          database: {
            status: 'unhealthy',
            details: {
              connected: false,
              tablesExist: false,
              userCount: 0,
              adminCount: 0,
              hasDefaultAdmin: false,
            },
          },
          firefly: 'unknown',
          ocr: 'unknown',
        },
      },
    })
  }
})

export default router
