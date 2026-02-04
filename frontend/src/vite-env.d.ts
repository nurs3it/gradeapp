/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TOLGEE_API_URL?: string
  readonly VITE_TOLGEE_API_KEY?: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

