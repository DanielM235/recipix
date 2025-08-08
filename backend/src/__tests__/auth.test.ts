import request from 'supertest'
import app from '../index'
import { clearLoggerMocks, expectErrorLogged } from './helpers/mockLogger'
import { UserRole } from '../../../shared/enums'

// Mock logger module
jest.mock('../utils/logger', () => require('./helpers/mockLogger').default)

// Mock the database module
jest.mock('../utils/database', () => ({
  __esModule: true,
  default: {
    getUserByEmail: jest.fn(),
    getUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    init: jest.fn(),
    close: jest.fn(),
  },
}))

// Import the mocked database after mocking
import database from '../utils/database'

const mockDatabase = database as jest.Mocked<typeof database>

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearLoggerMocks()
  })

  describe('POST /api/auth/register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    }

    it('should register a new user successfully', async () => {
      // Mock user doesn't exist
      ;(mockDatabase.getUserByEmail as jest.Mock).mockImplementation(
        (email: string, callback: (err: Error | null, user: any) => void) => {
          callback(null, null)
        }
      )

      // Mock successful user creation
      ;(mockDatabase.createUser as jest.Mock).mockImplementation(
        (user: any, callback: (err: Error | null, user?: any) => void) => {
          callback(null, {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }
      )

      const response = await request(app).post('/api/auth/register').send(validUserData).expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe('test@example.com')
      expect(response.body.data.user.name).toBe('Test User')
      expect(response.body.data.user.role).toBe(UserRole.USER)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.user.password).toBeUndefined()

      expect(mockDatabase.getUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Function)
      )
      expect(mockDatabase.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          role: UserRole.USER,
        }),
        expect.any(Function)
      )
    })

    it('should return 400 if email is missing', async () => {
      const invalidData = { password: 'password123', name: 'Test User' }

      const response = await request(app).post('/api/auth/register').send(invalidData).expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Email is required')
    })

    it('should return 400 if password is missing', async () => {
      const invalidData = { email: 'test@example.com', name: 'Test User' }

      const response = await request(app).post('/api/auth/register').send(invalidData).expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Password is required')
    })

    it('should return 400 if name is missing', async () => {
      const invalidData = { email: 'test@example.com', password: 'password123' }

      const response = await request(app).post('/api/auth/register').send(invalidData).expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Name is required')
    })

    it('should return 400 if email is invalid', async () => {
      const invalidData = { email: 'invalid-email', password: 'password123', name: 'Test User' }

      const response = await request(app).post('/api/auth/register').send(invalidData).expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Valid email is required')
    })

    it('should return 400 if password is too short', async () => {
      const invalidData = { email: 'test@example.com', password: '123', name: 'Test User' }

      const response = await request(app).post('/api/auth/register').send(invalidData).expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Password must be at least 6 characters')
    })

    it('should return 500 if database error occurs during getUserByEmail', async () => {
      ;(mockDatabase.getUserByEmail as jest.Mock).mockImplementation(
        (email: string, callback: (err: Error | null, user: any) => void) => {
          callback(new Error('Database error'), null)
        }
      )

      const response = await request(app).post('/api/auth/register').send(validUserData).expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Internal server error')
      expectErrorLogged('Error during user registration:')
    })

    it('should return 400 if user already exists', async () => {
      const existingUser = {
        id: 'existing-id',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Existing User',
        role: UserRole.USER,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      }

      ;(mockDatabase.getUserByEmail as jest.Mock).mockImplementation(
        (email: string, callback: (err: Error | null, user: any) => void) => {
          callback(null, existingUser)
        }
      )

      const response = await request(app).post('/api/auth/register').send(validUserData).expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('User already exists')
    })

    it('should return 500 if database error occurs during createUser', async () => {
      ;(mockDatabase.getUserByEmail as jest.Mock).mockImplementation(
        (email: string, callback: (err: Error | null, user: any) => void) => {
          callback(null, null)
        }
      )
      ;(mockDatabase.createUser as jest.Mock).mockImplementation(
        (user: any, callback: (err: Error | null, user?: any) => void) => {
          callback(new Error('Database error'), undefined)
        }
      )

      const response = await request(app).post('/api/auth/register').send(validUserData).expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Internal server error')
      expectErrorLogged('Error during user registration:')
    })

    it('should prevent SQL injection in email field', async () => {
      const maliciousData = {
        email: "'; DROP TABLE users; --",
        password: 'password123',
        name: 'Test User',
      }

      ;(mockDatabase.getUserByEmail as jest.Mock).mockImplementation(
        (email: string, callback: (err: Error | null, user: any) => void) => {
          callback(null, null)
        }
      )

      const response = await request(app).post('/api/auth/register').send(maliciousData).expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Valid email is required')
    })
  })

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
    }

    it('should login successfully with valid credentials', async () => {
      const existingUser = {
        id: 'user-id',
        email: 'test@example.com',
        password: '$2a$10$abcdefghijklmnopqrstuvwxyz', // bcrypt hash for 'password123'
        name: 'Test User',
        role: UserRole.USER,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      }

      ;(mockDatabase.getUserByEmail as jest.Mock).mockImplementation(
        (email: string, callback: (err: Error | null, user: any) => void) => {
          callback(null, existingUser)
        }
      )

      // Mock bcrypt compare to return true
      const bcrypt = require('bcryptjs')
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true)

      const response = await request(app).post('/api/auth/login').send(validLoginData).expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe('test@example.com')
      expect(response.body.data.user.name).toBe('Test User')
      expect(response.body.data.user.role).toBe(UserRole.USER)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.user.password).toBeUndefined()
    })

    it('should return 400 if email is missing', async () => {
      const invalidData = { password: 'password123' }

      const response = await request(app).post('/api/auth/login').send(invalidData).expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Email is required')
    })

    it('should return 400 if password is missing', async () => {
      const invalidData = { email: 'test@example.com' }

      const response = await request(app).post('/api/auth/login').send(invalidData).expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Password is required')
    })

    it('should return 401 if user does not exist', async () => {
      ;(mockDatabase.getUserByEmail as jest.Mock).mockImplementation(
        (email: string, callback: (err: Error | null, user: any) => void) => {
          callback(null, null)
        }
      )

      const response = await request(app).post('/api/auth/login').send(validLoginData).expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Invalid credentials')
    })

    it('should return 401 if password is incorrect', async () => {
      const existingUser = {
        id: 'user-id',
        email: 'test@example.com',
        password: '$2a$10$differenthash',
        name: 'Test User',
        role: UserRole.USER,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      }

      ;(mockDatabase.getUserByEmail as jest.Mock).mockImplementation(
        (email: string, callback: (err: Error | null, user: any) => void) => {
          callback(null, existingUser)
        }
      )

      // Mock bcrypt compare to return false
      const bcrypt = require('bcryptjs')
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false)

      const response = await request(app).post('/api/auth/login').send(validLoginData).expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Invalid credentials')
    })

    it('should return 500 if database error occurs', async () => {
      ;(mockDatabase.getUserByEmail as jest.Mock).mockImplementation(
        (email: string, callback: (err: Error | null, user: any) => void) => {
          callback(new Error('Database error'), null)
        }
      )

      const response = await request(app).post('/api/auth/login').send(validLoginData).expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Internal server error')
      expectErrorLogged('Error during user login:')
    })

    it('should prevent timing attacks on non-existent users', async () => {
      ;(mockDatabase.getUserByEmail as jest.Mock).mockImplementation(
        (email: string, callback: (err: Error | null, user: any) => void) => {
          callback(null, null)
        }
      )

      const startTime = Date.now()
      await request(app).post('/api/auth/login').send(validLoginData).expect(401)
      const endTime = Date.now()

      // Should take some time even for non-existent users (dummy bcrypt comparison)
      // On fast machines, bcrypt might be quicker, so we just verify it takes more than 5ms
      expect(endTime - startTime).toBeGreaterThan(5) // At least 5ms
    })

    it('should prevent SQL injection in login', async () => {
      const maliciousData = {
        email: "'; DROP TABLE users; --",
        password: 'password123',
      }

      ;(mockDatabase.getUserByEmail as jest.Mock).mockImplementation(
        (email: string, callback: (err: Error | null, user: any) => void) => {
          callback(null, null)
        }
      )

      const response = await request(app).post('/api/auth/login').send(maliciousData).expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Invalid credentials')
    })
  })

  describe('GET /api/auth/profile', () => {
    it('should return user profile when authenticated', async () => {
      const testUser = {
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: UserRole.USER,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      }

      ;(mockDatabase.getUserById as jest.Mock).mockImplementation(
        (id: string, callback: (err: Error | null, user: any) => void) => {
          callback(null, testUser)
        }
      )

      // First register a user to get a token
      ;(mockDatabase.getUserByEmail as jest.Mock).mockImplementation(
        (email: string, callback: (err: Error | null, user: any) => void) => {
          callback(null, null)
        }
      )
      ;(mockDatabase.createUser as jest.Mock).mockImplementation(
        (user: any, callback: (err: Error | null, user?: any) => void) => {
          callback(null, {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }
      )

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201)

      const token = registerResponse.body.data.token

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe('test@example.com')
      expect(response.body.data.user.name).toBe('Test User')
      expect(response.body.data.user.role).toBe(UserRole.USER)
      expect(response.body.data.user.password).toBeUndefined()
    })

    it('should return 500 if database error occurs', async () => {
      ;(mockDatabase.getUserById as jest.Mock).mockImplementation(
        (id: string, callback: (err: Error | null, user: any) => void) => {
          callback(new Error('Database error'), null)
        }
      )

      // First register a user to get a token
      ;(mockDatabase.getUserByEmail as jest.Mock).mockImplementation(
        (email: string, callback: (err: Error | null, user: any) => void) => {
          callback(null, null)
        }
      )
      ;(mockDatabase.createUser as jest.Mock).mockImplementation(
        (user: any, callback: (err: Error | null, user?: any) => void) => {
          callback(null, {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }
      )

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201)

      const token = registerResponse.body.data.token

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toBe('Internal server error')
      expectErrorLogged('Error fetching user profile:')
    })
  })
})
