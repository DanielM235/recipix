/// <reference types="vite/client" />

// Build-time constants injected by Vite
declare const __APP_VERSION__: string
declare const __APP_NAME__: string

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly DEV: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
