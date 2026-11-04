import { createRequire } from 'node:module'

import { pino } from 'pino'

import { serverEnv } from '@/server/env'

const isDev = process.env.NODE_ENV !== 'production'

// Sous le module runner de Vite, pino ne retrouve pas son appelant et ne sait plus résoudre
// une cible par son nom : on lui donne le chemin du module.
const prettyTarget = (): string => createRequire(import.meta.url).resolve('pino-pretty')

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
          target: prettyTarget(),
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' },
        },
      }
    : {}),
})
