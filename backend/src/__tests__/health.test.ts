import request from 'supertest'
import app from '../index'
import { clearLoggerMocks } from './helpers/mockLogger'

// Mock logger to prevent console pollution during tests
jest.mock('../utils/logger', () => require('./helpers/mockLogger').default)

// Mock the database health check for tests
jest.mock('../utils/startupVerification', () => ({
  getDatabaseHealth: jest.fn().mockResolvedValue({
    status: 'healthy',
    details: {
      connected: true,
      tablesExist: true,
      userCount: 0,
      adminCount: 0,
      hasDefaultAdmin: false,
    },
  }),
}))

describe('Health Endpoints', () => {
  beforeEach(() => {
    clearLoggerMocks()
  })
  describe('GET /api/health', () => {
    it('should return basic health status', async () => {
      const response = await request(app).get('/api/health').expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('status', 'OK')
      expect(response.body.data).toHaveProperty('timestamp')
      expect(response.body.data).toHaveProperty('uptime')
      expect(response.body.data).toHaveProperty('environment')
      expect(response.body.data).toHaveProperty('version', '0.0.1')
    })
  })

  describe('GET /api/health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await request(app).get('/api/health/detailed').expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body.data).toHaveProperty('status', 'OK')
      expect(response.body.data).toHaveProperty('dependencies')
      expect(response.body.data.dependencies).toHaveProperty('firefly')
      expect(response.body.data.dependencies).toHaveProperty('ocr')
    })
  })
})
