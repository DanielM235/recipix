#!/usr/bin/env node

import { initializeDatabase } from './src/utils/initDatabase'

console.log('Testing database initialization with migrations...')

// Test with development environment
process.env.NODE_ENV = 'development'

initializeDatabase()
  .then(() => {
    console.log('✅ Database initialized successfully with migrations and seeds')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Database initialization failed:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  })
