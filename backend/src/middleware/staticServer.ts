import express from 'express'
import path from 'path'
import fs from 'fs'
import logger from '../utils/logger'

export interface StaticServerConfig {
  frontendPath: string
  publicBasePath?: string
  uploadsPath: string
  uploadsDir: string
}

/**
 * Creates middleware for serving static files with security and SPA support
 * Compatible with React Router for client-side routing
 */
export function createStaticServer(config: StaticServerConfig): express.Router {
  const router = express.Router()
  const { frontendPath, publicBasePath = '', uploadsPath, uploadsDir } = config

  // Validate frontend path and files
  const safeFrontendPath = path.resolve(frontendPath)
  const indexPath = path.join(safeFrontendPath, 'index.html')

  try {
    if (!fs.existsSync(indexPath)) {
      logger.error(`Frontend index.html not found at: ${indexPath}`)
      throw new Error('Frontend assets not found')
    }
    logger.info(`✅ Frontend assets validated at: ${safeFrontendPath}`)
  } catch (error) {
    logger.error('Frontend static files validation failed:', error)
    throw error
  }

  // Security options for static file serving
  const staticOptions = {
    dotfiles: 'deny', // Deny access to dotfiles (.env, .git, etc.)
    etag: true, // Enable ETags for efficient caching
    extensions: [
      // Whitelist allowed file extensions
      'html',
      'js',
      'css',
      'json',
      'png',
      'jpg',
      'jpeg',
      'gif',
      'ico',
      'svg',
      'webp',
      'woff',
      'woff2',
      'ttf',
      'eot',
    ],
    fallthrough: false, // Don't fall through to next middleware on error
    immutable: true, // Assets are immutable (good for long-term caching)
    index: 'index.html', // Default index file
    lastModified: true, // Include Last-Modified header for caching
    maxAge: '1y', // Cache static assets for 1 year
    redirect: false, // Don't redirect to trailing slash
    setHeaders: (res: express.Response, filePath: string, _stat: unknown) => {
      // Security headers for all static files
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('X-Frame-Options', 'DENY')
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

      // Special handling for index.html (no caching for SPA routing)
      if (path.basename(filePath) === 'index.html') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')
      }

      // Log static file access for security monitoring
      logger.debug(`Static file served: ${filePath}`)
    },
  }

  // Serve uploaded files with security restrictions
  router.use(
    uploadsPath,
    express.static(uploadsDir, {
      dotfiles: 'deny',
      etag: true,
      extensions: ['jpg', 'jpeg', 'png', 'gif', 'pdf'], // Only allow specific upload types
      fallthrough: false,
      maxAge: '30d', // Cache uploads for 30 days
      setHeaders: (res: express.Response, filePath: string) => {
        res.setHeader('X-Content-Type-Options', 'nosniff')
        res.setHeader('Cache-Control', 'public, max-age=2592000') // 30 days
        logger.debug(`Upload file served: ${filePath}`)
      },
    })
  )

  // Serve frontend static files
  if (publicBasePath) {
    router.use(publicBasePath, express.static(safeFrontendPath, staticOptions))
  } else {
    router.use(express.static(safeFrontendPath, staticOptions))
  }

  return router
}

/**
 * Creates SPA (Single Page Application) fallback middleware
 * Handles React Router client-side routing by serving index.html
 * for non-API, non-upload routes
 */
export function createSPAFallback(config: StaticServerConfig): express.RequestHandler {
  const { frontendPath, publicBasePath = '' } = config
  const safeFrontendPath = path.resolve(frontendPath)
  const indexPath = path.join(safeFrontendPath, 'index.html')

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Only handle GET requests
    if (req.method !== 'GET') {
      return next()
    }

    // Don't handle API routes
    if (publicBasePath) {
      if (
        req.path.startsWith(`${publicBasePath}/api/`) ||
        req.path.startsWith(`${publicBasePath}/uploads/`)
      ) {
        return next()
      }
    } else if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next()
    }

    // Don't handle requests for files with extensions (except .html)
    const ext = path.extname(req.path)
    if (ext && ext !== '.html') {
      return next()
    }

    // For SPA routing, serve index.html
    logger.debug(`SPA fallback: ${req.path} -> index.html`)

    res.sendFile(
      indexPath,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
      err => {
        if (err) {
          logger.error('Error serving SPA index:', err)
          res.status(500).json({
            success: false,
            error: 'Internal server error',
          })
        }
      }
    )
  }
}

/**
 * Configures static server middleware for production
 * Returns both static server and SPA fallback middleware
 */
export function setupProductionStaticServer(
  frontendDistPath: string,
  publicBasePath?: string,
  uploadsDir?: string
): {
  staticServer: express.Router
  spaFallback: express.RequestHandler
} {
  const uploadsPath = publicBasePath ? `${publicBasePath}/uploads` : '/uploads'
  const resolvedUploadsDir = uploadsDir || path.join(__dirname, '../../uploads')

  const config: StaticServerConfig = {
    frontendPath: frontendDistPath,
    publicBasePath,
    uploadsPath,
    uploadsDir: resolvedUploadsDir,
  }

  return {
    staticServer: createStaticServer(config),
    spaFallback: createSPAFallback(config),
  }
}
