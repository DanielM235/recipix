import { Knex } from 'knex'
import { User, UserCreateInput, UserUpdateInput, UserPublic, UserEntity } from '../entities'
import logger from '../../utils/logger'

export class UserRepository {
  private readonly db: Knex

  constructor(database: Knex) {
    this.db = database
  }

  // Map database row to User interface
  private mapDbRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      role: row.role,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const row = await this.db(UserEntity.TABLE_NAME).where(UserEntity.COLUMNS.ID, id).first()

      return row ? this.mapDbRowToUser(row) : null
    } catch (error) {
      logger.error('Error finding user by ID:', error)
      throw error
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const row = await this.db(UserEntity.TABLE_NAME)
        .where(UserEntity.COLUMNS.EMAIL, email.toLowerCase())
        .first()

      return row ? this.mapDbRowToUser(row) : null
    } catch (error) {
      logger.error('Error finding user by email:', error)
      throw error
    }
  }

  async create(userData: UserCreateInput): Promise<string> {
    try {
      const now = new Date()

      await this.db(UserEntity.TABLE_NAME).insert({
        [UserEntity.COLUMNS.ID]: userData.id,
        [UserEntity.COLUMNS.EMAIL]: userData.email.toLowerCase(),
        [UserEntity.COLUMNS.PASSWORD]: userData.password,
        [UserEntity.COLUMNS.NAME]: userData.name,
        [UserEntity.COLUMNS.ROLE]: userData.role || 'USER',
        [UserEntity.COLUMNS.CREATED_AT]: now,
        [UserEntity.COLUMNS.UPDATED_AT]: now,
      })

      return userData.id
    } catch (error) {
      logger.error('Error creating user:', error)
      throw error
    }
  }

  async update(id: string, updates: UserUpdateInput): Promise<boolean> {
    try {
      const updateData: Record<string, any> = {
        [UserEntity.COLUMNS.UPDATED_AT]: new Date(),
      }

      if (updates.email) updateData[UserEntity.COLUMNS.EMAIL] = updates.email.toLowerCase()
      if (updates.password) updateData[UserEntity.COLUMNS.PASSWORD] = updates.password
      if (updates.name) updateData[UserEntity.COLUMNS.NAME] = updates.name
      if (updates.role) updateData[UserEntity.COLUMNS.ROLE] = updates.role

      const affectedRows = await this.db(UserEntity.TABLE_NAME)
        .where(UserEntity.COLUMNS.ID, id)
        .update(updateData)

      return affectedRows > 0
    } catch (error) {
      logger.error('Error updating user:', error)
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const affectedRows = await this.db(UserEntity.TABLE_NAME)
        .where(UserEntity.COLUMNS.ID, id)
        .del()

      return affectedRows > 0
    } catch (error) {
      logger.error('Error deleting user:', error)
      throw error
    }
  }

  async list(limit = 50, offset = 0): Promise<UserPublic[]> {
    try {
      const rows = await this.db(UserEntity.TABLE_NAME)
        .select(
          UserEntity.COLUMNS.ID,
          UserEntity.COLUMNS.EMAIL,
          UserEntity.COLUMNS.NAME,
          UserEntity.COLUMNS.ROLE,
          UserEntity.COLUMNS.CREATED_AT,
          UserEntity.COLUMNS.UPDATED_AT
        )
        .limit(limit)
        .offset(offset)
        .orderBy(UserEntity.COLUMNS.CREATED_AT, 'desc')

      return rows.map(row => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }))
    } catch (error) {
      logger.error('Error listing users:', error)
      throw error
    }
  }

  async count(): Promise<number> {
    try {
      const result = await this.db(UserEntity.TABLE_NAME).count('* as count').first()
      return Number(result?.count) || 0
    } catch (error) {
      logger.error('Error counting users:', error)
      throw error
    }
  }

  async exists(email: string): Promise<boolean> {
    try {
      const user = await this.db(UserEntity.TABLE_NAME)
        .where(UserEntity.COLUMNS.EMAIL, email.toLowerCase())
        .first()

      return !!user
    } catch (error) {
      logger.error('Error checking if user exists:', error)
      throw error
    }
  }
}
