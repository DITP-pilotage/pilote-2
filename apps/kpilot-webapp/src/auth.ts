import ky, { HTTPError } from 'ky'
import type { MeApiModel } from '@pilote/kpilot-shared/me'
import { z } from 'zod'

import { fetchMe } from '@/api/me'
import { tokenStore } from '@/auth/tokenStore'

export type Provider = 'proconnect' | 'keycloak'

export type Auth = {
  isAuthenticated: boolean
  user: MeApiModel | null
  bootstrap: () => Promise<void>
  login: (redirect?: string, provider?: Provider) => void
  logout: () => Promise<void>
}

const bffClient = ky.create({
  prefixUrl: new URL('/auth/', location.origin).toString(),
  credentials: 'include',
})

const refreshResponseSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().nullable(),
})

const logoutResponseSchema = z.object({
  logoutUrl: z.string().nullable(),
})

const state: { user: MeApiModel | null } = {
  user: null,
}

let inFlightRefresh: Promise<string | null> | null = null

const performRefresh = async (): Promise<string | null> => {
  try {
    const json = await bffClient.post('refresh').json()
    const parsed = refreshResponseSchema.safeParse(json)
    if (!parsed.success) {
      tokenStore.clear()
      return null
    }
    tokenStore.set(parsed.data.accessToken)
    return parsed.data.accessToken
  } catch (error) {
    if (error instanceof HTTPError && error.response.status < 500) {
      tokenStore.clear()
    }
    return null
  }
}

export const refreshAccessToken = (): Promise<string | null> => {
  if (inFlightRefresh) return inFlightRefresh
  inFlightRefresh = performRefresh().finally(() => {
    inFlightRefresh = null
  })
  return inFlightRefresh
}

export const auth: Auth = {
  get isAuthenticated() {
    return state.user !== null
  },
  get user() {
    return state.user
  },
  async bootstrap() {
    try {
      const token = await refreshAccessToken()
      if (!token) {
        state.user = null
        return
      }
      state.user = await fetchMe()
    } catch {
      tokenStore.clear()
      state.user = null
    }
  },
  login(redirect, provider = 'proconnect') {
    const params = new URLSearchParams({ provider })
    if (redirect) params.set('redirect', redirect)
    window.location.assign(`/auth/login?${params.toString()}`)
  },
  async logout() {
    let logoutUrl: string | null = null
    try {
      const json = await bffClient.post('logout').json()
      const parsed = logoutResponseSchema.safeParse(json)
      logoutUrl = parsed.success ? parsed.data.logoutUrl : null
    } catch {
      logoutUrl = null
    } finally {
      tokenStore.clear()
      state.user = null
    }
    window.location.assign(logoutUrl ?? '/')
  },
}
