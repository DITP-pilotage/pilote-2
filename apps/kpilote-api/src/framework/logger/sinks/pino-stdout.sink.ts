import { createRequire } from 'node:module'

import { pino, type Logger as PinoLogger } from 'pino'

import { type Env } from '@/env'
import { type LogEntry, type LogSink } from '@/framework/logger/log-sink'

const isDev = process.env['NODE_ENV'] !== 'production'

// Sous le module runner de Vite, pino ne retrouve pas son appelant et ne sait plus résoudre
// une cible par son nom : on lui donne le chemin du module.
const prettyTarget = (): string => createRequire(import.meta.url).resolve('pino-pretty')

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
              target: prettyTarget(),
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
