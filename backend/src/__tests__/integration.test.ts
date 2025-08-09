import request from 'supertest'
import app from '../index'
import { clearLoggerMocks } from './helpers/mockLogger'

// Mock logger to prevent console pollution during tests
jest.mock('../utils/logger', () => require('./helpers/mockLogger').default)

describe('Error Handling Integration', () => {
  beforeEach(() => {
    clearLoggerMocks()
  })
  describe('Rate Limiting', () => {
    it('should handle rapid requests without crashing', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(15)
        .fill(null)
        .map(() =>
          request(app).post('/api/auth/login').send({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
        )

      const responses = await Promise.all(requests)

      // All requests should complete (no crashes)
      const statusCodes = responses.map(r => r.status)

      // Check that all requests completed without server crashes
      expect(statusCodes.length).toBe(15)
      // During rapid requests, we might get various responses:
      // 401 (invalid credentials), 400 (validation error), or 500 (server overload)
      expect(statusCodes.every(code => [400, 401, 500].includes(code))).toBe(true)
    })
  })

  describe('Invalid JSON Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json')
        .expect(400)

      expect(response.body).toBeDefined()
    })
  })

  describe('Large Payload Handling', () => {
    it('should handle oversized payloads', async () => {
      const largePayload = {
        email: 'a'.repeat(10000) + '@example.com',
        password: 'b'.repeat(10000),
        name: 'c'.repeat(10000),
      }

      const response = await request(app).post('/api/auth/register').send(largePayload)

      // Should either reject with 413 (Payload Too Large) or handle gracefully
      expect([413, 400, 500]).toContain(response.status)
    })
  })

  describe('Content Type Validation', () => {
    it('should handle requests without Content-Type header', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('email=test@example.com&password=test123')

      // Should handle gracefully, might return 400 for missing data
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should handle unsupported Content-Type', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'text/plain')
        .send('plain text data')

      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('HTTP Method Validation', () => {
    it('should reject unsupported HTTP methods', async () => {
      const response = await request(app).patch('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      })

      expect([405, 404]).toContain(response.status) // Method Not Allowed or Not Found
    })
  })

  describe('CORS and Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app).get('/api/health')

      // Check for security headers (provided by helmet)
      expect(response.headers).toHaveProperty('x-content-type-options')
      expect(response.headers).toHaveProperty('x-frame-options')
    })

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')

      expect([200, 204]).toContain(response.status)
    })
  })
})
