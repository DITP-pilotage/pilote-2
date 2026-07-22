import { config } from 'dotenv'
import { z } from 'zod'

config({ path: process.env['NODE_ENV'] === 'test' ? '.env.test' : '.env' })

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
  OIDC_USERINFO_URL: z.url(),
  OIDC_JWKS_URI: z.url(),
  OIDC_AUDIENCE: z.string().min(1),
  KEYCLOAK_ISSUER_URL: z.url(),
  KEYCLOAK_JWKS_URI: z.url(),
  KEYCLOAK_AUDIENCE: z.string().min(1),
  API_KEY_HMAC_SECRET: z.string().min(32),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  LOG_TO_DATABASE: z.stringbool().default(false),
  MAX_ASYNC_CONCURRENCY: z.coerce.number().int().positive().default(5),
  ALBERT_API_KEY: z.string().min(1).optional(),
})

export type Env = z.infer<typeof envSchema>

export const env = envSchema.parse(process.env)
