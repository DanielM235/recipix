import { Router, Request, Response } from 'express'
import logger from '../utils/logger'

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
      version: '1.0.0',
    },
  })
})

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with dependencies
 * @access  Public
 */
router.get('/detailed', async (req: Request, res: Response) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    dependencies: {
      firefly: 'unknown', // Will be checked dynamically
      ocr: 'unknown',
    },
  }

  try {
    // Here you would check dependencies like database, external APIs, etc.
    // For now, just return the basic health check

    res.json({
      success: true,
      data: healthCheck,
    })
  } catch (error) {
    // Log the error using Winston or your logger
    logger.error('Detailed health check failed:', error)

    res.status(503).json({
      success: false,
      error: 'Service unavailable',
      data: {
        ...healthCheck,
        status: 'ERROR',
      },
    })
  }
})

export default router
