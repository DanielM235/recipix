export interface Receipt {
  id: string
  userId: string
  connectorId?: string
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string
  ocrText?: string
  extractedData?: Record<string, any>
  amount?: number
  currency?: string
  date?: Date
  merchant?: string
  category?: string
  description?: string
  status: ReceiptStatus
  processingErrors?: string[]
  externalId?: string
  createdAt: Date
  updatedAt: Date
}

export interface ReceiptCreateInput {
  id: string
  userId: string
  connectorId?: string
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string
  ocrText?: string
  extractedData?: Record<string, any>
  amount?: number
  currency?: string
  date?: Date
  merchant?: string
  category?: string
  description?: string
  status?: ReceiptStatus
}

export interface ReceiptUpdateInput {
  connectorId?: string
  ocrText?: string
  extractedData?: Record<string, any>
  amount?: number
  currency?: string
  date?: Date
  merchant?: string
  category?: string
  description?: string
  status?: ReceiptStatus
  processingErrors?: string[]
  externalId?: string
  updatedAt?: Date
}

export const TABLE_NAME = 'receipts'

// Database column mappings
export const COLUMNS = {
  ID: 'id',
  USER_ID: 'user_id',
  CONNECTOR_ID: 'connector_id',
  FILE_NAME: 'file_name',
  ORIGINAL_NAME: 'original_name',
  FILE_SIZE: 'file_size',
  MIME_TYPE: 'mime_type',
  OCR_TEXT: 'ocr_text',
  EXTRACTED_DATA: 'extracted_data',
  AMOUNT: 'amount',
  CURRENCY: 'currency',
  DATE: 'date',
  MERCHANT: 'merchant',
  CATEGORY: 'category',
  DESCRIPTION: 'description',
  STATUS: 'status',
  PROCESSING_ERRORS: 'processing_errors',
  EXTERNAL_ID: 'external_id',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
} as const

// Receipt processing status
export enum ReceiptStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  SENT = 'sent',
  FAILED = 'failed',
}
