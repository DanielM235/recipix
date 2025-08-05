import { initializeDatabase } from '../../utils/initDatabase'

// Setup database before tests
beforeAll(async () => {
  // Set test environment to ensure test database configuration is used
  process.env.NODE_ENV = 'test'
  await initializeDatabase()
})

export const setupDatabase = async () => {
  process.env.NODE_ENV = 'test'
  await initializeDatabase()
}
