import { initializeDatabase } from '../../test-utils/initDatabase'

// Setup database before tests
beforeAll(async () => {
  // Set test environment to ensure test database configuration is used
  process.env.NODE_ENV = 'test'
  await initializeDatabase()
})
