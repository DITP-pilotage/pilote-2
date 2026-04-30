const STORAGE_KEY = 'mb-auth'

export type AuthUser = {
  name: string
  email: string
}

export type Auth = {
  isAuthenticated: boolean
  user: AuthUser | null
  login: () => void
  logout: () => void
}

const FAKE_USER: AuthUser = {
  name: 'Marie Curie',
  email: 'marie@pilote-mb.fr',
}

const readStorage = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    return parsed
  } catch {
    return null
  }
}

const state: { user: AuthUser | null } = {
  user: readStorage(),
}

export const auth: Auth = {
  get isAuthenticated() {
    return state.user !== null
  },
  get user() {
    return state.user
  },
  login() {
    state.user = FAKE_USER
    localStorage.setItem(STORAGE_KEY, JSON.stringify(FAKE_USER))
  },
  logout() {
    state.user = null
    localStorage.removeItem(STORAGE_KEY)
  },
}
