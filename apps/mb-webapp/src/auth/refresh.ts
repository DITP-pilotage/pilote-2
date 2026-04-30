import { tokenStore } from '@/auth/tokenStore'

type RefreshResponse = {
  accessToken: string
  expiresIn: number | null
}

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

    const data = (await response.json()) as RefreshResponse
    tokenStore.set(data.accessToken)
    return data.accessToken
  })().finally(() => {
    inFlight = null
  })

  return inFlight
}
