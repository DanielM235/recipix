/**
 * Application version and metadata
 * These values are injected at build time by Vite
 */

export const APP_VERSION = __APP_VERSION__
export const APP_NAME = __APP_NAME__

/**
 * Get formatted version string
 */
export const getVersionString = (): string => {
  return `v${APP_VERSION}`
}

/**
 * Get full app info
 */
export const getAppInfo = () => ({
  name: APP_NAME,
  version: APP_VERSION,
  fullName: `${APP_NAME} v${APP_VERSION}`,
})
