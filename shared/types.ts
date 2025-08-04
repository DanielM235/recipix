// Shared types between frontend and backend
export interface Receipt {
  id: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  uploadedAt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  ocrData?: OCRData
  expenseData?: ExpenseData
  fireflyTransactionId?: string
  error?: string
}

export interface OCRData {
  text: string
  confidence: number
  extractedData: {
    amount?: number
    date?: string
    merchant?: string
    items?: string[]
  }
}

export interface ExpenseData {
  amount: number
  description: string
  category?: string
  date: string
  source_account?: string
  destination_account?: string
  currency_code?: string
  tags?: string[]
}

export interface FireflyTransaction {
  id: string
  type: 'withdrawal' | 'deposit' | 'transfer'
  date: string
  amount: string
  description: string
  source_account: string
  destination_account: string
  currency_code: string
  tags?: string[]
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface UploadResponse {
  receipt: Receipt
  uploadUrl?: string
}

export interface ProcessingStatus {
  receiptId: string
  status: Receipt['status']
  progress?: number
  message?: string
}

export interface ConnectorConfig {
  id?: string
  userId?: string
  type: 'firefly' | 'xero' | 'erp'
  name: string
  baseUrl: string
  apiKey?: string
  clientId?: string
  clientSecret?: string
  accessToken?: string
  refreshToken?: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Settings {
  language: 'en' | 'pt-BR'
  theme: 'light' | 'dark' | 'system'
  connectors: ConnectorConfig[]
  defaultConnector?: string
  autoProcess: boolean
  notificationsEnabled: boolean
}
