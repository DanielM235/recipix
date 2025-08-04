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
import logger from './utils/logger'

// Routes
import healthRouter from './routes/health'
import receiptsRouter from './routes/receipts'
import connectorsRouter from './routes/connectors'
import authRouter from './routes/auth'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})
app.use('/api/', limiter)

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

// Static files (for uploaded files)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API Routes
app.use('/api/auth', authRouter)
app.use('/api/health', healthRouter)
app.use('/api/receipts', receiptsRouter)
app.use('/api/connectors', connectorsRouter)

// Error handling middleware
app.use(notFoundHandler)
app.use(errorHandler)

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`)
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
    logger.info(`🔗 API URL: http://localhost:${PORT}/api`)
  })
}

export default app
