import { z } from 'zod'

import { authClient } from '@/api/client'

const ENVIRONMENTS = ['local', 'dev', 'prod'] as const
export type Environment = (typeof ENVIRONMENTS)[number]

const sessionSchema = z.object({ environment: z.enum(ENVIRONMENTS), label: z.string() }).nullable()

const rememberedEntrySchema = z.object({ label: z.string(), prefix: z.string() })
// Clé enum côté serveur, mais on parse en record souple (Zod 4 rend les records à
// clé enum exhaustifs ; ici le serveur ne renvoie que les env effectivement mémorisés).
const rememberedSchema = z.record(z.string(), rememberedEntrySchema)

export type RememberedKey = { label: string; prefix: string }
export type RememberedKeys = Partial<Record<Environment, RememberedKey>>

export type SessionState = { environment: Environment; label: string } | null

export type ConfirmResult = { ok: boolean; error?: string }

export type SessionStore = {
  readonly current: SessionState
  bootstrap: () => Promise<void>
  confirm: (environment: Environment, apiKey: string) => Promise<ConfirmResult>
  remembered: () => Promise<RememberedKeys>
  useRemembered: (environment: Environment) => Promise<ConfirmResult>
  forget: (environment: Environment) => Promise<void>
  logout: () => Promise<void>
}

const state: { current: SessionState } = { current: null }

const toConfirmError = (error: unknown): ConfirmResult => {
  const status = (error as { response?: Response }).response?.status
  if (status === 401) return { ok: false, error: 'invalid_key' }
  if (status === 502) return { ok: false, error: 'environment_unreachable' }
  return { ok: false, error: 'unknown' }
}

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
      return toConfirmError(error)
    }
  },
  async remembered() {
    try {
      const json = await authClient.get('remembered').json()
      const parsed = rememberedSchema.parse(json)
      const result: RememberedKeys = {}
      for (const environment of ENVIRONMENTS) {
        const entry = parsed[environment]
        if (entry) result[environment] = entry
      }
      return result
    } catch {
      return {}
    }
  },
  async useRemembered(environment) {
    try {
      const json = await authClient.post('use', { json: { environment } }).json()
      state.current = sessionSchema.parse(json)
      return { ok: true }
    } catch (error) {
      return toConfirmError(error)
    }
  },
  async forget(environment) {
    try {
      await authClient.post('forget', { json: { environment } })
    } catch {
      // best-effort
    }
  },
  async logout() {
    try {
      await authClient.post('logout')
    } finally {
      state.current = null
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('mbadmin_prod_edit_unlocked')
      }
    }
  },
}
