// @vitest-environment node
import { Hono } from 'hono'
import { sealData } from 'iron-session'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { readVault, requireSession, type AdminSession, type Vault } from './session'

const { SESSION_SECRET } = vi.hoisted(() => ({
  SESSION_SECRET: 'secret-de-test-suffisamment-long-pour-iron',
}))

vi.mock('@/server/env', () => ({
  serverEnv: {
    SESSION_SECRET,
    API_BASE_URL_LOCAL: 'http://localhost:3000',
    API_BASE_URL_DEV: 'http://localhost:3000',
    API_BASE_URL_PROD: 'http://localhost:3000',
  },
}))

const app = new Hono()
  .get('/session', async (context) => context.json(await requireSession(context)))
  .get('/vault', async (context) => context.json(await readVault(context)))

const session: AdminSession = { environment: 'dev', apiKey: 'kp_dev_123', label: 'Clé dev' }
const vault: Vault = { prod: { apiKey: 'kp_prod_456', label: 'Clé prod' } }

const seal = (data: unknown, ttl = 3600) => sealData(data, { password: SESSION_SECRET, ttl })
const tamper = (sealed: string) => `${sealed.slice(0, -4)}AAAA`

const get = (path: string, cookie: string) => app.request(path, { headers: { cookie } })

afterEach(() => {
  vi.useRealTimers()
})

describe('requireSession', () => {
  it('returns the session of a valid cookie', async () => {
    const response = await get('/session', `mbadmin_session=${await seal(session)}`)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(session)
  })

  it('answers 401 when the cookie has expired', async () => {
    const sealed = await seal(session, 60)
    vi.useFakeTimers({ now: Date.now() + 2 * 60 * 1000, toFake: ['Date'] })

    expect((await get('/session', `mbadmin_session=${sealed}`)).status).toBe(401)
  })

  it('answers 401 and logs the reason when the cookie has been tampered with', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const response = await get('/session', `mbadmin_session=${tamper(await seal(session))}`)

    expect(response.status).toBe(401)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('mbadmin_session'), 'invalid')
  })

  it('answers 401 when the decrypted content is not a session', async () => {
    const response = await get('/session', `mbadmin_session=${await seal({ environment: 'dev' })}`)

    expect(response.status).toBe(401)
  })

  it('answers 401 when the environment is unknown', async () => {
    const sealed = await seal({ ...session, environment: 'staging' })

    expect((await get('/session', `mbadmin_session=${sealed}`)).status).toBe(401)
  })
})

describe('readVault', () => {
  it('returns the stored keys of a valid cookie', async () => {
    expect(await (await get('/vault', `mbadmin_vault=${await seal(vault)}`)).json()).toEqual(vault)
  })

  it('returns an empty vault when the cookie has been tampered with', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const response = await get('/vault', `mbadmin_vault=${tamper(await seal(vault))}`)

    expect(await response.json()).toEqual({})
  })

  it('returns an empty vault when an entry is malformed', async () => {
    const sealed = await seal({ prod: { label: 'Clé prod' } })

    expect(await (await get('/vault', `mbadmin_vault=${sealed}`)).json()).toEqual({})
  })
})
