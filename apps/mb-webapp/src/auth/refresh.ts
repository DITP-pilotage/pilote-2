import { z } from 'zod'

import { tokenStore } from '@/auth/tokenStore'

const refreshResponseSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().nullable(),
})

let inFlight: Promise<string | null> | null = null

export const refreshAccessToken = (): Promise<string | null> => {
  if (inFlight) return inFlight

  inFlight = (async () => {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      tokenStore.clear()
      return null
    }

    const json: unknown = await response.json().catch(() => null)
    const parsed = refreshResponseSchema.safeParse(json)
    if (!parsed.success) {
      tokenStore.clear()
      return null
    }

    tokenStore.set(parsed.data.accessToken)
    return parsed.data.accessToken
  })().finally(() => {
    inFlight = null
  })

  return inFlight
}
