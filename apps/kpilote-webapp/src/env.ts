import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_MATOMO_URL: z.url().optional(),
  VITE_MATOMO_SITE_ID: z.string().min(1).optional(),
  VITE_ANALYTICS_ENABLED: z.stringbool().default(false),
})

const parsed = envSchema.parse(import.meta.env)

export const env = {
  apiUrl: parsed.VITE_API_URL,
  matomoUrl: parsed.VITE_MATOMO_URL,
  matomoSiteId: parsed.VITE_MATOMO_SITE_ID,
  analyticsEnabled: parsed.VITE_ANALYTICS_ENABLED,
}
