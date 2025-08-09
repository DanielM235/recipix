import request from 'supertest'
import path from 'path'
import fs from 'fs'
import app from '../index'

// Mock frontend files for testing
const mockFrontendDir = path.join(__dirname, '../../test-frontend')
const mockIndexPath = path.join(mockFrontendDir, 'index.html')

beforeAll(async () => {
  // Create mock frontend directory and index.html
  if (!fs.existsSync(mockFrontendDir)) {
    fs.mkdirSync(mockFrontendDir, { recursive: true })
  }
  
  const mockIndexContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Recipix</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="root"></div>
  <script src="/static/js/main.js"></script>
</body>
</html>
  `.trim()
  
  fs.writeFileSync(mockIndexPath, mockIndexContent)
  
  // Set environment for testing
  process.env.NODE_ENV = 'production'
  process.env.FRONTEND_DIST_PATH = mockFrontendDir
})

afterAll(async () => {
  // Clean up mock files
  if (fs.existsSync(mockFrontendDir)) {
    fs.rmSync(mockFrontendDir, { recursive: true, force: true })
  }
  process.env.NODE_ENV = 'test'
})

describe('SPA Routing Compatibility', () => {
  test('should serve index.html for root path', async () => {
    const response = await request(app)
      .get('/')
      .expect(200)
    
    expect(response.text).toContain('<div id="root"></div>')
    expect(response.headers['cache-control']).toContain('no-cache')
  })

  test('should serve index.html for React Router paths', async () => {
    const testPaths = [
      '/dashboard',
      '/receipts',
      '/receipts/123',
      '/settings',
      '/auth/login'
    ]

    for (const testPath of testPaths) {
      const response = await request(app)
        .get(testPath)
        .expect(200)
      
      expect(response.text).toContain('<div id="root"></div>')
      expect(response.headers['cache-control']).toContain('no-cache')
    }
  })

  test('should not interfere with API routes', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200)
    
    expect(response.body).toEqual({
      success: true,
      message: 'Server is healthy',
      timestamp: expect.any(String),
      uptime: expect.any(Number)
    })
  })

  test('should handle 404 for missing static files', async () => {
    const response = await request(app)
      .get('/static/js/nonexistent.js')
      .expect(404)
    
    expect(response.body).toEqual({
      success: false,
      error: 'Not Found',
      message: 'The requested resource was not found on this server.'
    })
  })

  test('should serve assets with proper caching headers', async () => {
    // Create a mock CSS file
    const cssPath = path.join(mockFrontendDir, 'main.css')
    fs.writeFileSync(cssPath, 'body { margin: 0; }')

    const response = await request(app)
      .get('/main.css')
      .expect(200)
    
    expect(response.headers['cache-control']).toContain('max-age')
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    
    // Clean up
    fs.unlinkSync(cssPath)
  })

  test('should deny access to dotfiles', async () => {
    // Create a mock dotfile
    const dotfilePath = path.join(mockFrontendDir, '.env')
    fs.writeFileSync(dotfilePath, 'SECRET=test')

    const response = await request(app)
      .get('/.env')
      .expect(403)
    
    // Clean up
    fs.unlinkSync(dotfilePath)
  })
})

describe('Static Server Security', () => {
  test('should include security headers', async () => {
    const response = await request(app)
      .get('/')
      .expect(200)
    
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-frame-options']).toBe('DENY')
    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })

  test('should handle paths with special characters safely', async () => {
    const specialPaths = [
      '/../../../etc/passwd',
      '/..%2F..%2F..%2Fetc%2Fpasswd',
      '/static/../../../etc/passwd'
    ]

    for (const testPath of specialPaths) {
      await request(app)
        .get(testPath)
        .expect(200) // Should serve index.html for SPA routing
        .expect(res => {
          expect(res.text).toContain('<div id="root"></div>')
        })
    }
  })
})
