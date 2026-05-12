import 'dotenv/config'

import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  VITE_API_URL: z.url(),
  API_BASE_URL: z.url(),
  OIDC_ISSUER_URL: z.url(),
  OIDC_CLIENT_ID: z.string().min(1),
  OIDC_CLIENT_SECRET: z.string().min(1),
  OIDC_REDIRECT_URI: z.url(),
  OIDC_POST_LOGOUT_REDIRECT_URI: z.url(),
  SESSION_SECRET: z
    .string()
    .min(32)
    .refine(
      (value) => !value.toLowerCase().startsWith('change-me'),
      'SESSION_SECRET still uses the placeholder value — set a real secret.',
    ),
  PUBLIC_BASE_URL: z.url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
})

export const serverEnv = envSchema.parse(process.env)
