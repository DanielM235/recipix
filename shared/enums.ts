// User roles enum
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

// User interface
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}
