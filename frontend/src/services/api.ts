import axios, { AxiosInstance, AxiosResponse } from 'axios'
import type {
  Receipt,
  ExpenseData,
  ApiResponse,
  UploadResponse,
  ProcessingStatus,
  ConnectorConfig,
} from '../../../shared/types'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor for auth
    this.api.interceptors.request.use(config => {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // File upload with progress
  async uploadReceipt(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('receipt', file)

    const response: AxiosResponse<ApiResponse<UploadResponse>> = await this.api.post(
      '/receipts/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: progressEvent => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        },
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Upload failed')
    }

    return response.data.data!
  }

  // Get receipt by ID
  async getReceipt(id: string): Promise<Receipt> {
    const response: AxiosResponse<ApiResponse<Receipt>> = await this.api.get(`/receipts/${id}`)

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get receipt')
    }

    return response.data.data!
  }

  // Get all receipts
  async getReceipts(page = 1, limit = 20): Promise<{ receipts: Receipt[]; total: number }> {
    const response: AxiosResponse<ApiResponse<{ receipts: Receipt[]; total: number }>> =
      await this.api.get(`/receipts?page=${page}&limit=${limit}`)

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get receipts')
    }

    return response.data.data!
  }

  // Process receipt with OCR
  async processReceipt(id: string): Promise<ProcessingStatus> {
    const response: AxiosResponse<ApiResponse<ProcessingStatus>> = await this.api.post(
      `/receipts/${id}/process`
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to process receipt')
    }

    return response.data.data!
  }

  // Submit expense to financial system
  async submitExpense(
    receiptId: string,
    expenseData: ExpenseData,
    connector = 'firefly'
  ): Promise<{ transactionId: string }> {
    const response: AxiosResponse<ApiResponse<{ transactionId: string }>> = await this.api.post(
      `/receipts/${receiptId}/submit`,
      {
        expenseData,
        connector,
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to submit expense')
    }

    return response.data.data!
  }

  // Test connector connection
  async testConnector(config: ConnectorConfig): Promise<{ connected: boolean; message: string }> {
    const response: AxiosResponse<ApiResponse<{ connected: boolean; message: string }>> =
      await this.api.post('/connectors/test', config)

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to test connection')
    }

    return response.data.data!
  }

  // Get connector status
  async getConnectorStatus(type: string): Promise<{ connected: boolean; lastSync?: string }> {
    const response: AxiosResponse<ApiResponse<{ connected: boolean; lastSync?: string }>> =
      await this.api.get(`/connectors/${type}/status`)

    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get connector status')
    }

    return response.data.data!
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response: AxiosResponse<ApiResponse<{ status: string; timestamp: string }>> =
      await this.api.get('/health')

    if (!response.data.success) {
      throw new Error('Health check failed')
    }

    return response.data.data!
  }
}

export const apiService = new ApiService()
export default apiService
