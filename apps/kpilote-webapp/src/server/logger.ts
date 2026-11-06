import { createRequire } from 'node:module'

import { pino } from 'pino'

import { serverEnv } from '@/server/env'

const isDev = process.env.NODE_ENV !== 'production'

// Chemin absolu : sous le module runner SSR de Vite, pino ne sait pas résoudre une
// cible nue (`'pino-pretty'`) depuis les chemins de pile qu'il reçoit.
const resolvePinoPretty = (): string => createRequire(import.meta.url).resolve('pino-pretty')

export const logger = pino({
  level: serverEnv.LOG_LEVEL,
  base: { app: 'kpilote-webapp-bff' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'token',
      '*.token',
      '*.refreshToken',
    ],
    censor: '[REDACTED]',
  },
  ...(isDev
    ? {
        transport: {
          target: resolvePinoPretty(),
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' },
        },
      }
    : {}),
})
