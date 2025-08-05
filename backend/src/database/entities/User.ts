import { UserRole } from '../../../../shared/enums'

export interface User {
  id: string
  email: string
  password: string
  name: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface UserCreateInput {
  id: string
  email: string
  password: string
  name: string
  role?: UserRole
}

export interface UserUpdateInput {
  email?: string
  password?: string
  name?: string
  role?: UserRole
  updatedAt?: Date
}

export interface UserPublic {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export const TABLE_NAME = 'users'

// Database column mappings
export const COLUMNS = {
  ID: 'id',
  EMAIL: 'email',
  PASSWORD: 'password',
  NAME: 'name',
  ROLE: 'role',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
} as const

// Helper function to exclude password from user object
export const toPublicUser = (user: User): UserPublic => {
  const { password, ...publicUser } = user
  return publicUser
}
