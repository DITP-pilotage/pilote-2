import type { Environment } from '@/session'

// URLs publiques du webapp par environnement, injectées à la build (toutes bakées,
// sélectionnées au runtime selon l'environnement de session). Non configuré → pas de lien.
const URLS_WEBAPP: Record<Environment, string | undefined> = {
  local: import.meta.env.VITE_WEBAPP_URL_LOCAL,
  dev: import.meta.env.VITE_WEBAPP_URL_DEV,
  prod: import.meta.env.VITE_WEBAPP_URL_PROD,
}

export const urlWebappArticle = (environment: Environment | null, id: string): string | null => {
  if (!environment) return null
  const base = URLS_WEBAPP[environment]
  if (!base) return null
  return `${base.replace(/\/$/, '')}/centre-aide?article=${encodeURIComponent(id)}`
}
