import axios, { AxiosResponse } from 'axios'
import logger from '../utils/logger'
import { ExpenseData, ConnectorConfig } from '../../../shared/types'

export interface ExpenseConnector {
  name: string
  type: string
  config: ConnectorConfig
  testConnection(): Promise<{ connected: boolean; message: string }>
  submitExpense(expenseData: ExpenseData): Promise<{ transactionId: string; success: boolean }>
}

export class FireflyConnector implements ExpenseConnector {
  name = 'Firefly III'
  type = 'firefly'
  config: ConnectorConfig

  constructor(config: ConnectorConfig) {
    this.config = config
  }

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      await axios.get(`${this.config.baseUrl}/api/v1/about`, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          Accept: 'application/json',
        },
        timeout: 10000,
      })

      return { connected: true, message: 'Successfully connected to Firefly III' }
    } catch (error: any) {
      logger.error('Firefly connection test failed:', error)
      return { connected: false, message: error.message || 'Connection failed' }
    }
  }

  async submitExpense(
    expenseData: ExpenseData
  ): Promise<{ transactionId: string; success: boolean }> {
    try {
      // Prepare the transaction data for Firefly III API
      const transactionData = {
        group_title: null,
        error_if_duplicate_hash: false,
        apply_rules: true,
        fire_webhooks: true,
        transactions: [
          {
            type: 'withdrawal',
            date: expenseData.date,
            amount: expenseData.amount.toString(),
            description: expenseData.description,
            source_name: expenseData.source_account || 'Cash account',
            destination_name: expenseData.destination_account || 'Expense account',
            currency_code: expenseData.currency_code || 'USD',
            category_name: expenseData.category || 'General',
            tags: expenseData.tags || [],
          },
        ],
      }

      const response: AxiosResponse = await axios.post(
        `${this.config.baseUrl}/api/v1/transactions`,
        transactionData,
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      )

      if (response.status === 200 || response.status === 201) {
        const transactionId = response.data.data.attributes.transactions[0].transaction_journal_id
        logger.info(`Expense submitted to Firefly III: ${transactionId}`)

        return {
          transactionId: transactionId.toString(),
          success: true,
        }
      } else {
        throw new Error(`Unexpected response status: ${response.status}`)
      }
    } catch (error: any) {
      logger.error('Failed to submit expense to Firefly III:', error)
      throw new Error(`Firefly III submission failed: ${error.message}`)
    }
  }
}

// Placeholder for future Xero connector
export class XeroConnector implements ExpenseConnector {
  name = 'Xero'
  type = 'xero'
  config: ConnectorConfig

  constructor(config: ConnectorConfig) {
    this.config = config
  }

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    // Implement Xero connection test
    return { connected: false, message: 'Xero integration not implemented yet' }
  }

  async submitExpense(
    _expenseData: ExpenseData
  ): Promise<{ transactionId: string; success: boolean }> {
    // Implement Xero expense submission
    throw new Error('Xero integration not implemented yet')
  }
}

// Placeholder for future ERP connector
export class ERPConnector implements ExpenseConnector {
  name = 'ERP System'
  type = 'erp'
  config: ConnectorConfig

  constructor(config: ConnectorConfig) {
    this.config = config
  }

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    // Implement ERP connection test
    return { connected: false, message: 'ERP integration not implemented yet' }
  }

  async submitExpense(
    _expenseData: ExpenseData
  ): Promise<{ transactionId: string; success: boolean }> {
    // Implement ERP expense submission
    throw new Error('ERP integration not implemented yet')
  }
}

// Factory function to create connectors
export function createConnector(config: ConnectorConfig): ExpenseConnector {
  switch (config.type) {
    case 'firefly':
      return new FireflyConnector(config)
    case 'xero':
      return new XeroConnector(config)
    case 'erp':
      return new ERPConnector(config)
    default:
      throw new Error(`Unsupported connector type: ${config.type}`)
  }
}
