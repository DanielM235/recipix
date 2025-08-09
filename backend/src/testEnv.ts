// Test environment setup
import path from 'path'

process.env.NODE_ENV = 'test'
process.env.PORT = '0' // Use random port for tests
process.env.LOG_LEVEL = 'error' // Reduce log noise in tests

// Mock any other environment variables needed for tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-very-secure-for-testing-only'
}

if (!process.env.UPLOAD_DIR) {
  process.env.UPLOAD_DIR = path.join(__dirname, '../uploads')
}

// Set test database path (use memory by default for tests)
if (!process.env.TEST_DATABASE_PATH) {
  process.env.TEST_DATABASE_PATH = ':memory:'
}

if (!process.env.MAX_FILE_SIZE) {
  process.env.MAX_FILE_SIZE = '10485760' // 10MB
}

if (!process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN = 'http://localhost:3000'
}
