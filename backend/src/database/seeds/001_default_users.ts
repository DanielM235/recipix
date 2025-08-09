import type { Knex } from 'knex'
import bcrypt from 'bcryptjs'
import { UserEntity } from '../entities'
import { UserRole } from '../../../../shared/enums'

export async function seed(knex: Knex): Promise<void> {
  // Clear existing entries
  await knex(UserEntity.TABLE_NAME).del()

  // Insert default users
  await knex(UserEntity.TABLE_NAME).insert([
    {
      [UserEntity.COLUMNS.ID]: 'admin-1',
      [UserEntity.COLUMNS.EMAIL]: 'admin@recipix.com',
      [UserEntity.COLUMNS.PASSWORD]: bcrypt.hashSync('admin123', 10),
      [UserEntity.COLUMNS.NAME]: 'Admin User',
      [UserEntity.COLUMNS.ROLE]: UserRole.ADMIN,
      [UserEntity.COLUMNS.CREATED_AT]: knex.fn.now(),
      [UserEntity.COLUMNS.UPDATED_AT]: knex.fn.now(),
    },
    {
      [UserEntity.COLUMNS.ID]: 'user-1',
      [UserEntity.COLUMNS.EMAIL]: 'user@recipix.com',
      [UserEntity.COLUMNS.PASSWORD]: bcrypt.hashSync('user123', 10),
      [UserEntity.COLUMNS.NAME]: 'Demo User',
      [UserEntity.COLUMNS.ROLE]: UserRole.USER,
      [UserEntity.COLUMNS.CREATED_AT]: knex.fn.now(),
      [UserEntity.COLUMNS.UPDATED_AT]: knex.fn.now(),
    },
  ])
}
