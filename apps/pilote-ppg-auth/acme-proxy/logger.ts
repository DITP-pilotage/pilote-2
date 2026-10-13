import { pino } from 'pino'

/**
 * JSON sur stdout, une ligne par événement, pour que le drain de logs Scalingo les indexe.
 * Pas de transport `pino-pretty` : ses workers ne survivent pas au bundle esbuild.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { app: 'acme-proxy' },
})
