// Global test setup
import DatabaseService from './database/connection'

// Global cleanup after each test to prevent open handles
afterEach(() => {
  // Clear timers
  jest.clearAllTimers()
})

afterAll(async () => {
  // Close database connections
  try {
    const dbService = DatabaseService.getInstance()
    await dbService.close()
  } catch (error) {
    // Log error during cleanup but don't fail tests
    console.warn('Error during database cleanup:', error)
  }

  // Final cleanup
  await new Promise<void>(resolve => setTimeout(() => resolve(), 100))
})

export {}
