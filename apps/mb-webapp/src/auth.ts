import { fetchMe } from '@/api/me'
import { refreshAccessToken } from '@/auth/refresh'
import { tokenStore } from '@/auth/tokenStore'

export type AuthUser = {
  id: string
}

export type Auth = {
  isAuthenticated: boolean
  user: AuthUser | null
  bootstrap: () => Promise<void>
  login: () => void
  logout: () => Promise<void>
}

const state: { user: AuthUser | null } = {
  user: null,
}

export const auth: Auth = {
  get isAuthenticated() {
    return state.user !== null
  },
  get user() {
    return state.user
  },
  async bootstrap() {
    const token = await refreshAccessToken()
    if (!token) {
      state.user = null
      return
    }
    try {
      const me = await fetchMe()
      state.user = { id: me.id }
    } catch {
      tokenStore.clear()
      state.user = null
    }
  },
  login() {
    window.location.assign('/auth/login')
  },
  async logout() {
    try {
      const response = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      const data = (await response.json().catch(() => null)) as
        | { logoutUrl: string | null }
        | null
      tokenStore.clear()
      state.user = null
      window.location.assign(data?.logoutUrl ?? '/')
    } catch {
      tokenStore.clear()
      state.user = null
      window.location.assign('/')
    }
  },
}
