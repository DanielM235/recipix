import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import logger from '../utils/logger'

const router = Router()

// Mock user database - replace with real database
interface User {
  id: string
  email: string
  password: string
  name: string
  role: 'USER' | 'ADMIN'
  createdAt: Date
}

// Mock users for demo
const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@recipix.com',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMye9JpTlHH7N1d.W.UpZ8X2Zi3K0OKGUoW', // 'admin123'
    name: 'Admin User',
    role: 'ADMIN',
    createdAt: new Date(),
  },
  {
    id: 'user-2',
    email: 'user@recipix.com',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMye9JpTlHH7N1d.W.UpZ8X2Zi3K0OKGUoW', // 'user123'
    name: 'Regular User',
    role: 'USER',
    createdAt: new Date(),
  }
]

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    // Find user by email
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    )

    logger.info(`User logged in: ${user.email} (${user.role})`)

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  } catch (error) {
    logger.error('Login error:', error)
    next(error)
  }
})

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      })
    }

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user (first user is admin, others are users)
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: mockUsers.length === 0 ? 'ADMIN' : 'USER',
      createdAt: new Date()
    }

    mockUsers.push(newUser)

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    )

    logger.info(`New user registered: ${newUser.email} (${newUser.role})`)

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      }
    })
  } catch (error) {
    logger.error('Registration error:', error)
    next(error)
  }
})

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    const user = mockUsers.find(u => u.id === decoded.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    logger.error('Get profile error:', error)
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    })
  }
})

export default router
