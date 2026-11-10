import { createRequire } from 'node:module'

import { pino } from 'pino'

import { serverEnv } from '@/server/env'

const isDev = process.env.NODE_ENV !== 'production'

// Chemin absolu de pino-pretty, résolu depuis ce fichier. Avec un nom de paquet nu, pino (>= 10.4)
// cherche le fichier appelant via util.getCallSites ; sous le serveur de dev vite, le code évalué
// par le module runner n'a pas de nom de fichier et la résolution échoue (« unable to determine
// transport target »). Résolu seulement en dev : pino-pretty n'est pas installé en production.
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
