import jwt from 'jsonwebtoken'
import request from 'supertest'
import { UserRole } from '../../../shared/enums'
import app from '../index'
import { clearLoggerMocks, expectErrorLogged } from './helpers/mockLogger'

// Mock database module
jest.mock('../utils/database', () => ({
  getUserByEmail: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  close: jest.fn(),
}))

// Mock logger module
jest.mock('../utils/logger', () => require('./helpers/mockLogger').default)

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
      mockDatabase.getUserByEmail.mockImplementation((email, callback) => {
        callback(null, undefined)
      })

      // Mock successful user creation
      mockDatabase.createUser.mockImplementation((user, callback) => {
        callback(null, user.id)
      })

      const response = await request(app).post('/api/auth/register').send(validUserData).expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe('test@example.com')
      expect(response.body.data.user.name).toBe('Test User')
      expect(response.body.data.user.role).toBe(UserRole.USER)
      expect(response.body.data.token).toBeDefined()
    })

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'password123',
          name: 'Test User',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Email, password, and name are required')
    })

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          password: '12345',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Password must be at least 6 characters long')
    })

    it('should return 400 when user already exists', async () => {
      // Mock user exists
      mockDatabase.getUserByEmail.mockImplementation((email, callback) => {
        callback(null, {
          id: 'existing-user',
          email: 'test@example.com',
          password: 'hashedpassword',
          name: 'Existing User',
          role: UserRole.USER,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        })
      })

      const response = await request(app).post('/api/auth/register').send(validUserData).expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('User with this email already exists')
    })

    it('should handle database errors', async () => {
      mockDatabase.getUserByEmail.mockImplementation((email, callback) => {
        callback(new Error('Database error'))
      })

      const response = await request(app).post('/api/auth/register').send(validUserData).expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Internal server error')

      // Verify error was logged
      expectErrorLogged('Database error during registration')
    })
  })

  describe('POST /api/auth/login', () => {
    const userData = {
      id: 'test-user-1',
      email: 'test@example.com',
      password: '$2b$10$wtI2qsOVAigatW1jx8ofXeSAUkcfPPX6sm3FetIHpE4rZGDB/8iau', // hashed 'password123'
      name: 'Test User',
      role: UserRole.USER,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }

    it('should login successfully with correct credentials', async () => {
      mockDatabase.getUserByEmail.mockImplementation((email, callback) => {
        callback(null, userData)
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe('test@example.com')
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.user).not.toHaveProperty('password')
    })

    it('should return 401 for non-existent user', async () => {
      mockDatabase.getUserByEmail.mockImplementation((email, callback) => {
        callback(null, undefined)
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid credentials')
    })

    it('should return 401 for incorrect password', async () => {
      mockDatabase.getUserByEmail.mockImplementation((email, callback) => {
        callback(null, userData)
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid credentials')
    })

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Email and password are required')
    })

    it('should handle case-insensitive email', async () => {
      mockDatabase.getUserByEmail.mockImplementation((email, callback) => {
        expect(email).toBe('test@example.com') // Should be normalized to lowercase
        callback(null, userData)
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: 'password123',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  describe('GET /api/auth/me', () => {
    const userData = {
      id: 'test-user-1',
      email: 'test@example.com',
      password: '$2b$10$wtI2qsOVAigatW1jx8ofXeSAUkcfPPX6sm3FetIHpE4rZGDB/8iau',
      name: 'Test User',
      role: UserRole.USER,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }

    let authToken: string

    beforeEach(() => {
      authToken = jwt.sign(
        {
          id: userData.id,
          email: userData.email,
          role: userData.role,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      )
    })

    it('should return current user info with valid token', async () => {
      mockDatabase.getUserById.mockImplementation((id, callback) => {
        expect(id).toBe('test-user-1')
        callback(null, userData)
      })

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe('test@example.com')
      expect(response.body.data.user).not.toHaveProperty('password')
    })

    it('should return 401 without authorization header', async () => {
      const response = await request(app).get('/api/auth/me').expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Access token required')
    })

    it('should return 403 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid or expired token')
    })

    it('should return 404 when user not found in database', async () => {
      mockDatabase.getUserById.mockImplementation((id, callback) => {
        callback(null, undefined)
      })

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('User not found')
    })
  })

  describe('Security Tests', () => {
    it('should hash passwords during registration', async () => {
      const password = 'testpassword123'
      const userData = {
        email: 'security@example.com',
        password,
        name: 'Security Test',
      }

      mockDatabase.getUserByEmail.mockImplementation((email, callback) => {
        callback(null, undefined)
      })

      let savedUser: any
      mockDatabase.createUser.mockImplementation((user, callback) => {
        savedUser = user
        callback(null, user.id)
      })

      await request(app).post('/api/auth/register').send(userData).expect(201)

      expect(savedUser.password).not.toBe(password)
      expect(savedUser.password).toMatch(/^\$2[ayb]\$.{56}$/) // bcrypt hash pattern
    })

    it('should validate JWT token structure', async () => {
      mockDatabase.getUserByEmail.mockImplementation((email, callback) => {
        callback(null, {
          id: 'jwt-test',
          email: 'jwt@example.com',
          password: '$2b$10$wtI2qsOVAigatW1jx8ofXeSAUkcfPPX6sm3FetIHpE4rZGDB/8iau',
          name: 'JWT Test',
          role: UserRole.USER,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        })
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jwt@example.com',
          password: 'password123',
        })
        .expect(200)

      const token = response.body.data.token
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts

      const decoded = jwt.decode(token) as any
      expect(decoded).toHaveProperty('id')
      expect(decoded).toHaveProperty('email')
      expect(decoded).toHaveProperty('role')
      expect(decoded).toHaveProperty('iat') // issued at
      expect(decoded).toHaveProperty('exp') // expiration
    })

    it('should prevent SQL injection in login', async () => {
      mockDatabase.getUserByEmail.mockImplementation((email, callback) => {
        // Verify the malicious string is passed as-is (parameterized queries prevent injection)
        expect(email).toBe("'; drop table users; --")
        callback(null, undefined)
      })

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "'; DROP TABLE users; --",
          password: 'password123',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid credentials')
    })

    it('should generate unique user IDs', async () => {
      mockDatabase.getUserByEmail.mockImplementation((email, callback) => {
        callback(null, undefined)
      })

      mockDatabase.createUser.mockImplementation((user, callback) => {
        callback(null, user.id)
      })

      const user1Response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user1@example.com',
          password: 'password123',
          name: 'User One',
        })
        .expect(201)

      const user2Response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'password123',
          name: 'User Two',
        })
        .expect(201)

      expect(user1Response.body.data.user.id).not.toBe(user2Response.body.data.user.id)
      expect(user1Response.body.data.user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })
  })
})
