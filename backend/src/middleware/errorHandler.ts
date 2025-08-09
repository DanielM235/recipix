import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

interface CustomError extends Error {
  statusCode?: number
  status?: string
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Set default error values
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'

  // Log error
  logger.error('Error Handler:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  })

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message = 'Resource not found'
    statusCode = 404
  }

  // Mongoose duplicate key
  if (err.name === 'MongoError' && (err as unknown as { code: number }).code === 11000) {
    message = 'Duplicate field value entered'
    statusCode = 400
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const validationError = err as unknown as { errors: Record<string, { message: string }> }
    message = Object.values(validationError.errors)
      .map((val: { message: string }) => val.message)
      .join(', ')
    statusCode = 400
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token'
    statusCode = 401
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired'
    statusCode = 401
  }

  // Multer errors
  if (err.name === 'MulterError') {
    const multerError = err as unknown as { code: string }
    if (multerError.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large'
      statusCode = 400
    } else if (multerError.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files'
      statusCode = 400
    } else if (multerError.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field'
      statusCode = 400
    }
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
