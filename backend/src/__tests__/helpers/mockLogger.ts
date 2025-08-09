import { jest } from '@jest/globals'

// Mock logger utility for tests
export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
}

// Helper to clear all logger mocks
export const clearLoggerMocks = () => {
  Object.values(mockLogger).forEach(mock => mock.mockClear())
}

// Helper to verify error logging
export const expectErrorLogged = (message: string | RegExp) => {
  expect(mockLogger.error).toHaveBeenCalledWith(
    expect.stringMatching(typeof message === 'string' ? new RegExp(message) : message),
    expect.any(Object)
  )
}

// Helper to verify info logging
export const expectInfoLogged = (message: string | RegExp) => {
  expect(mockLogger.info).toHaveBeenCalledWith(
    expect.stringMatching(typeof message === 'string' ? new RegExp(message) : message)
  )
}

export default mockLogger
