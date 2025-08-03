import { Router, Request, Response, NextFunction } from 'express'
import axios from 'axios'
import logger from '../utils/logger'
import { ConnectorConfig } from '../../../shared/types'

const router = Router()

/**
 * @route   POST /api/connectors/test
 * @desc    Test connector connection
 * @access  Public
 */
router.post('/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config: ConnectorConfig = req.body

    let result = { connected: false, message: 'Unknown connector type' }

    switch (config.type) {
      case 'firefly':
        result = await testFireflyConnection(config)
        break
      case 'xero':
        result = await testXeroConnection(config)
        break
      case 'erp':
        result = await testERPConnection(config)
        break
      default:
        result = { connected: false, message: 'Unsupported connector type' }
    }

    logger.info(`Connector test for ${config.type}: ${result.connected ? 'Success' : 'Failed'}`)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error('Connector test error:', error)
    next(error)
  }
})

/**
 * @route   GET /api/connectors/:type/status
 * @desc    Get connector status
 * @access  Public
 */
router.get('/:type/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params

    // This would typically check the last sync time, connection status, etc.
    // For now, return a basic status based on connector type
    const status = {
      connected: false,
      lastSync: null,
      type: type, // Include the connector type in response
    }

    res.json({
      success: true,
      data: status,
    })
  } catch (error) {
    next(error)
  }
})

// Connector-specific test functions
async function testFireflyConnection(
  config: ConnectorConfig
): Promise<{ connected: boolean; message: string }> {
  try {
    if (!config.baseUrl || !config.apiKey) {
      return { connected: false, message: 'Missing URL or API key' }
    }

    // Test the connection by making a simple API call
    const response = await axios.get(`${config.baseUrl}/api/v1/about`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: 'application/json',
      },
      timeout: 10000,
    })

    if (response.status === 200) {
      return { connected: true, message: 'Successfully connected to Firefly III' }
    } else {
      return { connected: false, message: `Unexpected response: ${response.status}` }
    }
  } catch (error: unknown) {
    const err = error as any // Type assertion for error object
    if (err.response) {
      return {
        connected: false,
        message: `HTTP ${err.response.status}: ${err.response.data?.message || 'Connection failed'}`,
      }
    } else if (err.code === 'ECONNREFUSED') {
      return { connected: false, message: 'Connection refused - check URL' }
    } else if (err.code === 'ENOTFOUND') {
      return { connected: false, message: 'Server not found - check URL' }
    } else {
      return { connected: false, message: err.message || 'Unknown error' }
    }
  }
}

async function testXeroConnection(
  _config: ConnectorConfig
): Promise<{ connected: boolean; message: string }> {
  // Placeholder for Xero integration
  return { connected: false, message: 'Xero integration not implemented yet' }
}

async function testERPConnection(
  _config: ConnectorConfig
): Promise<{ connected: boolean; message: string }> {
  // Placeholder for ERP integration
  return { connected: false, message: 'ERP integration not implemented yet' }
}

export default router
