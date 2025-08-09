import type { Knex } from 'knex'
import path from 'path'
import dotenv from 'dotenv'

// Load environment-specific config
const env = process.env.NODE_ENV || 'development'
if (env === 'development') {
  dotenv.config({ path: path.join(__dirname, '../../.env.development') })
} else if (env === 'test') {
  // Test config is handled in testEnv.ts
} else {
  // Production/other environments use root .env
  dotenv.config({ path: path.join(__dirname, '../../../.env') })
}

// Helper function to resolve database path
function getDatabasePath(envPath?: string, fallbackPath?: string): string {
  let resolvedPath: string
  
  if (envPath) {
    resolvedPath = envPath
  } else if (fallbackPath) {
    resolvedPath = fallbackPath
  } else {
    // Default fallback to backend/data directory from project root
    resolvedPath = path.join(process.cwd(), 'backend/data/recipix.db')
  }
  
  // Make relative paths absolute from project root
  if (!path.isAbsolute(resolvedPath)) {
    resolvedPath = path.join(process.cwd(), resolvedPath)
  }
  
  return resolvedPath
}

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: getDatabasePath(
        process.env.DATABASE_PATH,
        path.join(process.cwd(), 'backend/data/recipix.db')
      ),
    },
    migrations: {
      directory: path.join(__dirname, './migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, './seeds'),
      extension: 'ts',
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn: { run: Function }, done: Function) => {
        conn.run('PRAGMA foreign_keys = ON', done)
      },
    },
  },

  test: {
    client: 'sqlite3',
    connection: getDatabasePath(
      process.env.TEST_DATABASE_PATH,
      ':memory:'
    ),
    migrations: {
      directory: path.join(__dirname, './migrations'),
      extension: 'ts',
    },
    seeds: {
      directory: path.join(__dirname, './seeds'),
      extension: 'ts',
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn: { run: Function }, done: Function) => {
        conn.run('PRAGMA foreign_keys = ON', done)
      },
    },
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: getDatabasePath(
        process.env.DATABASE_PATH,
        path.join(process.cwd(), 'backend/data/recipix.db')
      ),
    },
    migrations: {
      directory: path.join(__dirname, './migrations'),
      extension: 'ts',
    },
    useNullAsDefault: true,
    pool: {
      min: 1,
      max: 10,
      afterCreate: (conn: { run: Function }, done: Function) => {
        conn.run('PRAGMA foreign_keys = ON', done)
      },
    },
  },
}

export default config
