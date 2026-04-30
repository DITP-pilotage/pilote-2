import { pino } from 'pino'

import { serverEnv } from '@/server/env'

const isDev = process.env.NODE_ENV !== 'production'

export const logger = pino({
  level: serverEnv.LOG_LEVEL,
  base: { app: 'mb-webapp-bff' },
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
