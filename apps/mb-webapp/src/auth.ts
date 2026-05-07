import ky, { HTTPError } from 'ky'
import { z } from 'zod'

import { fetchMe } from '@/api/me'
import { tokenStore } from '@/auth/tokenStore'

export type AuthUser = {
  prenom: string | undefined
  nom: string | undefined
}

export type Auth = {
  isAuthenticated: boolean
  user: AuthUser | null
  bootstrap: () => Promise<void>
  login: (redirect?: string) => void
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

const state: { user: AuthUser | null } = {
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
      const me = await fetchMe()
      state.user = { prenom: me.prenom, nom: me.nom }
    } catch {
      tokenStore.clear()
      state.user = null
    }
  },
  login(redirect) {
    const url = redirect
      ? `/auth/login?redirect=${encodeURIComponent(redirect)}`
      : '/auth/login'
    window.location.assign(url)
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
