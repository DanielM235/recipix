import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import logger from '../utils/logger'
import database, { DatabaseUser } from '../utils/database'
import { authenticateToken } from '../middleware/auth'
import { UserRole } from '../../../shared/enums'

// Authentication routes
const router = Router()

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email is required' },
      })
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password is required' },
      })
    }

    // Find user in database
    database.getUserByEmail(email.toLowerCase(), async (err, user) => {
      if (err) {
        logger.error('Error during user login:', err)
        return res.status(500).json({
          success: false,
          error: { message: 'Internal server error' },
        })
      }

      if (!user) {
        // Prevent timing attacks by always doing a bcrypt compare with proper dummy hash
        await bcrypt.compare('dummy', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid credentials' },
        })
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid credentials' },
        })
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      )

      logger.info(`User logged in: ${user.email}`)

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
      })
    })
  } catch (error) {
    logger.error('Login error:', error)
    next(error)
  }
})

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email is required' },
      })
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password is required' },
      })
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name is required' },
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Valid email is required' },
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 6 characters' },
      })
    }

    // Check if user already exists
    database.getUserByEmail(email.toLowerCase(), async (err, existingUser) => {
      if (err) {
        logger.error('Error during user registration:', err)
        return res.status(500).json({
          success: false,
          error: { message: 'Internal server error' },
        })
      }

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: { message: 'User already exists' },
        })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create new user
      const newUser: Omit<DatabaseUser, 'createdAt' | 'updatedAt'> = {
        id: uuidv4(),
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        role: UserRole.USER, // All new users start as regular users
      }

      database.createUser(newUser, (createErr, _createdUser) => {
        if (createErr) {
          logger.error('Error during user registration:', createErr)
          return res.status(500).json({
            success: false,
            error: { message: 'Internal server error' },
          })
        }

        // Generate JWT token
        const token = jwt.sign(
          {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        )

        logger.info(`New user registered: ${newUser.email}`)

        res.status(201).json({
          success: true,
          data: {
            user: {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
            },
            token,
          },
        })
      })
    })
  } catch (error) {
    logger.error('Registration error:', error)
    next(error)
  }
})

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      })
    }

    // Get fresh user data from database
    database.getUserById(req.user.id, (err, user) => {
      if (err) {
        logger.error('Error fetching user profile:', err)
        return res.status(500).json({
          success: false,
          error: { message: 'Internal server error' },
        })
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { message: 'User not found' },
        })
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
          },
        },
      })
    })
  } catch (error) {
    logger.error('Get user error:', error)
    next(error)
  }
})

// Add profile alias for backward compatibility
router.get('/profile', authenticateToken, (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      })
    }

    // Get fresh user data from database
    database.getUserById(req.user.id, (err, user) => {
      if (err) {
        logger.error('Error fetching user profile:', err)
        return res.status(500).json({
          success: false,
          error: { message: 'Internal server error' },
        })
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { message: 'User not found' },
        })
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
          },
        },
      })
    })
  } catch (error) {
    logger.error('Get user error:', error)
    next(error)
  }
})

export default router
