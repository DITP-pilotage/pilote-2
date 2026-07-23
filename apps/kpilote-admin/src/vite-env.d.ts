/// <reference types="vite/client" />

interface ImportMetaEnv {
  // URLs publiques du webapp par environnement (deep-link « Accéder à cet article »).
  readonly VITE_WEBAPP_URL_LOCAL?: string
  readonly VITE_WEBAPP_URL_DEV?: string
  readonly VITE_WEBAPP_URL_PROD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
