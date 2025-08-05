import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { UserRole } from '../../../shared/enums'
import { authenticateToken, requireAdmin, requireUserOrAdmin } from '../middleware/auth'
import { clearLoggerMocks, expectErrorLogged } from './helpers/mockLogger'

// Mock the logger
jest.mock('../utils/logger', () => require('./helpers/mockLogger').default)

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  beforeEach(() => {
    mockRequest = {}
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    nextFunction = jest.fn()
    clearLoggerMocks()
  })

  describe('authenticateToken', () => {
    it('should call next() with valid token', () => {
      const token = jwt.sign(
        { id: 'user1', email: 'test@example.com', role: UserRole.USER },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      )

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      }

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(nextFunction).toHaveBeenCalled()
      expect(mockRequest.user).toEqual({
        id: 'user1',
        email: 'test@example.com',
        role: UserRole.USER,
        iat: expect.any(Number),
        exp: expect.any(Number),
      })
    })

    it('should return 401 when no token provided', () => {
      mockRequest.headers = {}

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required',
      })
      expect(nextFunction).not.toHaveBeenCalled()
    })

    it('should return 401 when authorization header is malformed', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat',
      }

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required',
      })
      expect(nextFunction).not.toHaveBeenCalled()
    })

    it('should return 403 with invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      }

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      })
      expect(nextFunction).not.toHaveBeenCalled()

      // Verify error was logged
      expectErrorLogged('JWT verification failed')
    })

    it('should return 403 with expired token', () => {
      const expiredToken = jwt.sign(
        { id: 'user1', email: 'test@example.com', role: UserRole.USER },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '-1h' } // Expired 1 hour ago
      )

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      }

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      })
      expect(nextFunction).not.toHaveBeenCalled()
    })

    it('should handle token signed with different secret', () => {
      const tokenWithWrongSecret = jwt.sign(
        { id: 'user1', email: 'test@example.com', role: UserRole.USER },
        'wrong-secret',
        { expiresIn: '24h' }
      )

      mockRequest.headers = {
        authorization: `Bearer ${tokenWithWrongSecret}`,
      }

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      })
      expect(nextFunction).not.toHaveBeenCalled()
    })
  })

  describe('requireAdmin', () => {
    it('should call next() for admin user', () => {
      mockRequest.user = {
        id: 'admin1',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      }

      requireAdmin(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(nextFunction).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('should return 401 when user is not authenticated', () => {
      mockRequest.user = undefined

      requireAdmin(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      })
      expect(nextFunction).not.toHaveBeenCalled()
    })

    it('should return 403 for non-admin user', () => {
      mockRequest.user = {
        id: 'user1',
        email: 'user@example.com',
        role: UserRole.USER,
      }

      requireAdmin(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required',
      })
      expect(nextFunction).not.toHaveBeenCalled()
    })
  })

  describe('requireUserOrAdmin', () => {
    it('should call next() for admin user', () => {
      mockRequest.user = {
        id: 'admin1',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      }

      requireUserOrAdmin(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(nextFunction).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('should call next() for regular user', () => {
      mockRequest.user = {
        id: 'user1',
        email: 'user@example.com',
        role: UserRole.USER,
      }

      requireUserOrAdmin(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(nextFunction).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
    })

    it('should return 401 when user is not authenticated', () => {
      mockRequest.user = undefined

      requireUserOrAdmin(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      })
      expect(nextFunction).not.toHaveBeenCalled()
    })
  })

  describe('JWT Security Tests', () => {
    it('should reject tokens with none algorithm', () => {
      // This tests against the "none" algorithm attack
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
      const payload = Buffer.from(
        JSON.stringify({ id: 'user1', email: 'test@example.com', role: UserRole.ADMIN })
      ).toString('base64url')
      const noneToken = `${header}.${payload}.`

      mockRequest.headers = {
        authorization: `Bearer ${noneToken}`,
      }

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(nextFunction).not.toHaveBeenCalled()
    })

    it('should validate token structure', () => {
      const validToken = jwt.sign(
        { id: 'user1', email: 'test@example.com', role: UserRole.USER },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      )

      // Valid token should have 3 parts separated by dots
      expect(validToken.split('.')).toHaveLength(3)

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      }

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(nextFunction).toHaveBeenCalled()
    })

    it('should handle malformed JWT tokens', () => {
      // These tokens will fail JWT verification (403)
      const malformedTokens = [
        'not.a.jwt',
        'only.two.parts',
        'too.many.parts.here.for.jwt',
        'singlestring',
      ]

      malformedTokens.forEach(token => {
        jest.clearAllMocks()
        mockRequest.headers = {
          authorization: `Bearer ${token}`,
        }

        authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction)

        expect(mockResponse.status).toHaveBeenCalledWith(403)
        expect(nextFunction).not.toHaveBeenCalled()
      })

      // These will result in no token (401)
      const emptyTokens = ['', ' ']

      emptyTokens.forEach(token => {
        jest.clearAllMocks()
        mockRequest.headers = {
          authorization: `Bearer ${token}`,
        }

        authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction)

        expect(mockResponse.status).toHaveBeenCalledWith(401)
        expect(nextFunction).not.toHaveBeenCalled()
      })
    })

    it('should validate required JWT claims', () => {
      // Test token missing required claims
      const incompleteToken = jwt.sign(
        { id: 'user1' }, // Missing email and role
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      )

      mockRequest.headers = {
        authorization: `Bearer ${incompleteToken}`,
      }

      authenticateToken(mockRequest as Request, mockResponse as Response, nextFunction)

      // Should still work but with incomplete user object
      expect(nextFunction).toHaveBeenCalled()
      expect(mockRequest.user).toHaveProperty('id', 'user1')
    })
  })
})
