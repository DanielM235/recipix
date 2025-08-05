export interface Connector {
  id: string
  userId: string
  name: string
  type: string
  baseUrl: string
  apiKey?: string
  clientId?: string
  clientSecret?: string
  accessToken?: string
  refreshToken?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ConnectorCreateInput {
  id: string
  userId: string
  name: string
  type: string
  baseUrl: string
  apiKey?: string
  clientId?: string
  clientSecret?: string
  accessToken?: string
  refreshToken?: string
  isActive?: boolean
}

export interface ConnectorUpdateInput {
  name?: string
  baseUrl?: string
  apiKey?: string
  clientId?: string
  clientSecret?: string
  accessToken?: string
  refreshToken?: string
  isActive?: boolean
  updatedAt?: Date
}

export const TABLE_NAME = 'connectors'

// Database column mappings
export const COLUMNS = {
  ID: 'id',
  USER_ID: 'user_id',
  NAME: 'name',
  TYPE: 'type',
  BASE_URL: 'base_url',
  API_KEY: 'api_key',
  CLIENT_ID: 'client_id',
  CLIENT_SECRET: 'client_secret',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  IS_ACTIVE: 'is_active',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
} as const

// Connector types
export enum ConnectorType {
  FIREFLY_III = 'firefly_iii',
  EXPENSE_TRACKER = 'expense_tracker',
  CUSTOM = 'custom',
}
