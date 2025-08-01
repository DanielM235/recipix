import '@testing-library/jest-dom'

// Mock TextEncoder for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock IntersectionObserver for testing
const mockIntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
  root: null,
  rootMargin: '0px',
  thresholds: [],
  takeRecords: jest.fn().mockReturnValue([]),
}))

// Type assertion for global object - this is acceptable for test setup
;(global as typeof globalThis & { IntersectionObserver: jest.Mock }).IntersectionObserver =
  mockIntersectionObserver
;(
  global as typeof globalThis & { IntersectionObserver: typeof IntersectionObserver }
).IntersectionObserver = mockIntersectionObserver
