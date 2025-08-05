import type { Knex } from 'knex'
import path from 'path'

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, '../data/recipix.db'),
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
      afterCreate: (conn: any, done: Function) => {
        conn.run('PRAGMA foreign_keys = ON', done)
      },
    },
  },

  test: {
    client: 'sqlite3',
    connection: ':memory:',
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
      afterCreate: (conn: any, done: Function) => {
        conn.run('PRAGMA foreign_keys = ON', done)
      },
    },
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_PATH || path.join(__dirname, '../data/recipix.db'),
    },
    migrations: {
      directory: path.join(__dirname, './migrations'),
      extension: 'ts',
    },
    useNullAsDefault: true,
    pool: {
      min: 1,
      max: 10,
      afterCreate: (conn: any, done: Function) => {
        conn.run('PRAGMA foreign_keys = ON', done)
      },
    },
  },
}

export default config
