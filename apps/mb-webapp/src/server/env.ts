import 'dotenv/config'

import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  OIDC_ISSUER_URL: z.url(),
  OIDC_CLIENT_ID: z.string().min(1),
  OIDC_CLIENT_SECRET: z.string().min(1),
  OIDC_REDIRECT_URI: z.url(),
  OIDC_POST_LOGOUT_REDIRECT_URI: z.url(),
  SESSION_SECRET: z.string().min(32),
  PUBLIC_BASE_URL: z.url(),
})

export const serverEnv = envSchema.parse(process.env)
