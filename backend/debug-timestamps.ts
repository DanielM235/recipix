#!/usr/bin/env node

import { knex as knexInstance } from 'knex'
const knexConfig = require('./knexfile')

async function debugTimestamps() {
  const environment = process.env.NODE_ENV || 'development'
  const config = knexConfig[environment]
  const db = knexInstance(config)

  try {
    // Get the first user
    const user = await db('users').first()
    
    if (user) {
      console.log('Raw database row:', user)
      console.log('Type of created_at:', typeof user.created_at)
      console.log('Value of created_at:', user.created_at)
      console.log('Type of updated_at:', typeof user.updated_at)
      console.log('Value of updated_at:', user.updated_at)
      
      // Try to convert to Date
      try {
        const createdAtDate = new Date(user.created_at)
        console.log('Converted created_at:', createdAtDate)
        console.log('Is valid date:', !isNaN(createdAtDate.getTime()))
      } catch (error) {
        console.error('Error converting created_at:', error)
      }
    } else {
      console.log('No users found in database')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await db.destroy()
  }
}

debugTimestamps()
