import { z } from 'zod'

import { authClient } from '@/api/client'

const ENVIRONMENTS = ['local', 'dev', 'prod'] as const
export type Environment = (typeof ENVIRONMENTS)[number]

const sessionSchema = z.object({ environment: z.enum(ENVIRONMENTS), label: z.string() }).nullable()

export type SessionState = { environment: Environment; label: string } | null

export type SessionStore = {
  readonly current: SessionState
  bootstrap: () => Promise<void>
  confirm: (environment: Environment, apiKey: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
}

const state: { current: SessionState } = { current: null }

export const session: SessionStore = {
  get current() {
    return state.current
  },
  async bootstrap() {
    try {
      const json = await authClient.get('session').json()
      state.current = sessionSchema.parse(json)
    } catch {
      state.current = null
    }
  },
  async confirm(environment, apiKey) {
    try {
      const json = await authClient.post('confirm', { json: { environment, apiKey } }).json()
      state.current = sessionSchema.parse(json)
      return { ok: true }
    } catch (error) {
      const status = (error as { response?: Response }).response?.status
      if (status === 401) return { ok: false, error: 'invalid_key' }
      if (status === 502) return { ok: false, error: 'environment_unreachable' }
      return { ok: false, error: 'unknown' }
    }
  },
  async logout() {
    try {
      await authClient.post('logout')
    } finally {
      state.current = null
    }
  },
}
