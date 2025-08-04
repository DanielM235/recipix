import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import logger from '../utils/logger'
import { UserRole } from '../../../shared/enums'

export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as AuthenticatedUser
    req.user = decoded
    next()
  } catch (error) {
    logger.error('JWT verification failed:', error)
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    })
  }
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    })
  }

  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    })
  }

  next()
}

export const requireUserOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    })
  }

  // This middleware allows both USER and ADMIN roles
  // Additional logic can be added if needed
  next()
}
