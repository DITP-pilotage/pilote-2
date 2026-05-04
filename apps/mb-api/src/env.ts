import 'dotenv/config'

import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  OIDC_ISSUER_URL: z.url(),
  OIDC_JWKS_URI: z.url(),
  OIDC_AUDIENCE: z.string().min(1),
  OIDC_AUTHORIZED_PARTY: z.string().min(1),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
})

export const env = envSchema.parse(process.env)
