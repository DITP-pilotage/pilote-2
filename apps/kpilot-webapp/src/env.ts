import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.url(),
})

const parsed = envSchema.parse(import.meta.env)

export const env = {
  apiUrl: parsed.VITE_API_URL,
}
