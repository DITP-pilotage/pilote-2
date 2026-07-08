import ky, { HTTPError } from 'ky'

import type { Environment } from '@/server/environments'
import { mbApiUrlFor } from '@/server/environments'

export type WhoamiResult = { kind: 'user' | 'apiKey'; label: string }

export const fetchWhoami = async (
  environment: Environment,
  apiKey: string,
): Promise<WhoamiResult | null> => {
  try {
    const json = await ky
      .get(`${mbApiUrlFor(environment)}/auth/whoami`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        retry: 0,
        timeout: 5000,
      })
      .json<WhoamiResult>()
    return json
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 401) return null
    throw error
  }
}
