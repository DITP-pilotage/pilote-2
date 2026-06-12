import 'dotenv/config'

import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(4001),
  API_BASE_URL_LOCAL: z.url(),
  API_BASE_URL_DEV: z.url(),
  API_BASE_URL_PROD: z.url(),
  SESSION_SECRET: z
    .string()
    .min(32)
    .refine(
      (value) => !value.toLowerCase().startsWith('change-me'),
      'SESSION_SECRET utilise encore la valeur placeholder — définis un vrai secret.',
    ),
  PUBLIC_BASE_URL: z.url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
})

export const serverEnv = envSchema.parse(process.env)
