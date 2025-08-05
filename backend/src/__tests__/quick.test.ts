import request from 'supertest'
import app from '../index'
import './helpers/setupDatabase'

// Simple test to check basic functionality
describe('Quick Test', () => {
  it('should respond to health check', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
  })

  it('should respond to register endpoint', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User'
      })
    
    console.log('Register response:', response.status, response.body)
  })
})
