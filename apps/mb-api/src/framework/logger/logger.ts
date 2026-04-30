import { pino } from 'pino'

import { env } from '@/env'

const isDev = process.env.NODE_ENV !== 'production'

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { app: 'mb-api' },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'token', '*.token', '*.refreshToken'],
    censor: '[REDACTED]',
  },
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' },
        },
      }
    : {}),
})
