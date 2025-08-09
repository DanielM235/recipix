import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'

import { errorHandler } from './middleware/errorHandler'
import { notFoundHandler } from './middleware/notFoundHandler'
import { setupProductionStaticServer } from './middleware/staticServer'
import { initializeDatabaseOnStartup } from './utils/startupVerification'
import logger from './utils/logger'

// Routes
import healthRouter from './routes/health'
import receiptsRouter from './routes/receipts'
import connectorsRouter from './routes/connectors'
import authRouter from './routes/auth'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001
const BASE_PATH = process.env.PUBLIC_BASE_PATH || ''

// Get configuration from environment
const PUBLIC_BASE_PATH = process.env.PUBLIC_BASE_PATH || ''
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads')
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}/api`

// Log configuration
logger.info('🔧 Configuration loaded:')
logger.info(`   - Base path: ${PUBLIC_BASE_PATH}`)
logger.info(`   - Upload dir: ${UPLOAD_DIR}`)
logger.info(`   - API URL: ${API_BASE_URL}`)

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000'
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Rate limiting - apply to API routes only
const apiBasePath = PUBLIC_BASE_PATH ? `${PUBLIC_BASE_PATH}/api` : '/api'
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})
app.use(apiBasePath, limiter)

// Body parsing middleware
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging middleware
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
)

// Static files (for uploaded files) - use dynamic path
const uploadsPath = PUBLIC_BASE_PATH ? `${PUBLIC_BASE_PATH}/uploads` : '/uploads'
app.use(
  uploadsPath,
  express.static(UPLOAD_DIR, {
    dotfiles: 'deny',
    maxAge: '30d',
    setHeaders: res => {
      res.setHeader('X-Content-Type-Options', 'nosniff')
    },
  })
)

// API Routes - use dynamic base path
const apiRouter = express.Router()
apiRouter.use('/auth', authRouter)
apiRouter.use('/health', healthRouter)
apiRouter.use('/receipts', receiptsRouter)
apiRouter.use('/connectors', connectorsRouter)

// Mount API router on base path
if (PUBLIC_BASE_PATH) {
  app.use(`${PUBLIC_BASE_PATH}/api`, apiRouter)
} else {
  app.use('/api', apiRouter)
}

// Serve frontend static files in production with React Router support
if (process.env.NODE_ENV === 'production') {
  const frontendPath = process.env.FRONTEND_DIST_PATH || path.join(__dirname, '../frontend/dist')

  try {
    const { staticServer, spaFallback } = setupProductionStaticServer(
      frontendPath,
      PUBLIC_BASE_PATH,
      UPLOAD_DIR
    )

    // Apply static server middleware
    app.use(staticServer)

    // Apply SPA fallback for React Router (must be after API routes)
    app.use(spaFallback)

    logger.info('🌐 Static server configured with React Router support')
  } catch (error) {
    logger.error('❌ Failed to configure static server:', error)
    process.exit(1)
  }
}

// Error handling middleware
app.use(notFoundHandler)
app.use(errorHandler)

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  // Initialize database before starting the server
  initializeDatabaseOnStartup()
    .then(() => {
      app.listen(PORT, () => {
        logger.info(`🚀 Server running on port ${PORT}`)
        logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
        logger.info(`🔗 API URL: ${API_BASE_URL}`)
        if (PUBLIC_BASE_PATH) {
          const frontendUrl =
            process.env.FRONTEND_URL || `http://localhost:${PORT}${PUBLIC_BASE_PATH}`
          logger.info(`🌐 Frontend URL: ${frontendUrl}`)
        }
      })
    })
    .catch(error => {
      logger.error('💥 Failed to start server due to database initialization error:', error)
      process.exit(1)
    })
}

export default app
