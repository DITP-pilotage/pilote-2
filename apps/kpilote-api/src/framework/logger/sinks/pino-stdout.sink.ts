import { createRequire } from 'node:module'

import { pino, type Logger as PinoLogger } from 'pino'

import { type Env } from '@/env'
import { type LogEntry, type LogSink } from '@/framework/logger/log-sink'

const isDev = process.env['NODE_ENV'] !== 'production'

// Chemin absolu de pino-pretty, résolu depuis ce fichier. Avec un nom de paquet nu, pino (>= 10.4)
// cherche le fichier appelant via util.getCallSites ; sous le serveur de dev vite, le code évalué
// par le module runner n'a pas de nom de fichier et la résolution échoue (« unable to determine
// transport target »). Résolu seulement en dev : pino-pretty n'est pas installé en production.
const resolvePinoPretty = (): string => createRequire(import.meta.url).resolve('pino-pretty')

export class PinoStdoutSink implements LogSink {
  private readonly pino: PinoLogger

  constructor(env: Env) {
    this.pino = pino({
      level: env.LOG_LEVEL,
      base: { app: 'kpilote-api' },
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
  }

  write(entry: LogEntry): void {
    this.pino[entry.level](entry.context, entry.message)
  }
}
