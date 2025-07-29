// Global test setup

// Global cleanup after each test to prevent open handles
afterEach(() => {
  // Close any open servers or connections
  jest.clearAllTimers()
})

afterAll(async () => {
  // Final cleanup
  await new Promise<void>(resolve => setTimeout(() => resolve(), 100))
})

export {}
