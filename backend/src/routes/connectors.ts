import { Router, Request, Response, NextFunction } from 'express'
import axios from 'axios'
import logger from '../utils/logger'
import { ConnectorConfig } from '../../../shared/types'
import { authenticateToken, requireAdmin, requireUserOrAdmin } from '../middleware/auth'

const router = Router()

// All connector routes require authentication
router.use(authenticateToken)

/**
 * @route   POST /api/connectors
 * @desc    Create/save a new connector configuration (Admin only)
 * @access  Private (Admin)
 */
router.post('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, name, baseUrl, apiKey, userId } = req.body

    // TODO: Encrypt apiKey before storing
    // TODO: Save to database
    const connectorConfig = {
      id: `connector-${Date.now()}`,
      userId: userId || req.user?.id, // Admin can create for any user
      type,
      name,
      baseUrl,
      apiKey, // This should be encrypted
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    logger.info(`Created connector configuration: ${type} for user: ${connectorConfig.userId} by admin: ${req.user?.email}`)

    res.json({
      success: true,
      data: {
        id: connectorConfig.id,
        type: connectorConfig.type,
        name: connectorConfig.name,
        baseUrl: connectorConfig.baseUrl,
        isActive: connectorConfig.isActive,
        userId: connectorConfig.userId,
        // Note: apiKey is NOT returned to frontend
      },
    })
  } catch (error) {
    logger.error('Create connector error:', error)
    next(error)
  }
})

/**
 * @route   GET /api/connectors
 * @desc    Get connector configurations (User: own connectors, Admin: all connectors)
 * @access  Private
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    const isAdmin = req.user?.role === 'ADMIN'

    // TODO: Fetch from database with proper filtering
    const connectors = [
      // Mock data - replace with DB query
      {
        id: 'conn-1',
        type: 'firefly',
        name: 'My Firefly III',
        baseUrl: 'https://firefly.example.com',
        isActive: true,
        userId: isAdmin ? 'user-2' : userId, // Show different data based on role
        userName: isAdmin ? 'Regular User' : undefined, // Only show for admin
        // apiKey is never included in response
      },
    ]

    // Filter connectors based on role
    const filteredConnectors = isAdmin 
      ? connectors // Admin sees all
      : connectors.filter(conn => conn.userId === userId) // User sees only own

    res.json({
      success: true,
      data: filteredConnectors,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/connectors/:id/test
 * @desc    Test a saved connector configuration
 * @access  Private
 */
router.post('/:id/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Get userId from JWT token
    const userId = 'temp-user-id' // req.user?.id
    const { id } = req.params

    // TODO: Fetch connector config from database
    // const config = await getConnectorConfig(id, userId)
    // if (!config) return res.status(404).json({ success: false, message: 'Connector not found' })

    // Mock config for now - replace with DB query
    const config: ConnectorConfig = {
      name: 'Demo Firefly III',
      type: 'firefly',
      isActive: true,
      baseUrl: 'https://demo.firefly-iii.org',
      apiKey: 'demo-api-key', // This comes from encrypted DB storage
    }

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
 * @route   POST /api/connectors/test-connection
 * @desc    Test connector connection with provided credentials (for setup)
 * @access  Private
 */
router.post('/test-connection', async (req: Request, res: Response, next: NextFunction) => {
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
