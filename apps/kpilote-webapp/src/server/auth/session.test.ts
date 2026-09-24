// @vitest-environment node
import { Hono } from 'hono'
import { sealData } from 'iron-session'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { readPkce, readSession, type PkcePayload, type SessionPayload } from './session'

const { SESSION_SECRET } = vi.hoisted(() => ({
  SESSION_SECRET: 'secret-de-test-suffisamment-long-pour-iron',
}))

vi.mock('@/server/env', () => ({ serverEnv: { SESSION_SECRET } }))
vi.mock('@/server/logger', () => ({ logger: { warn: vi.fn() } }))

const { logger } = await import('@/server/logger')

const app = new Hono()
  .get('/auth/session', async (context) => context.json(await readSession(context)))
  .get('/auth/pkce', async (context) => context.json(await readPkce(context)))

const session: SessionPayload = {
  refreshToken: 'refresh-1',
  sub: 'sub-1',
  idToken: 'id-token-1',
  provider: 'proconnect',
}

const pkce: PkcePayload = {
  codeVerifier: 'verifier-1',
  state: 'state-1',
  nonce: 'nonce-1',
  provider: 'keycloak',
}

const seal = (data: unknown, ttl = 3600) => sealData(data, { password: SESSION_SECRET, ttl })

const read = async (path: string, cookie: string): Promise<unknown> => {
  const response = await app.request(path, { headers: { cookie } })
  return response.json()
}

afterEach(() => {
  vi.useRealTimers()
})

describe('readSession', () => {
  it('returns the payload of a valid cookie', async () => {
    expect(await read('/auth/session', `mb_session=${await seal(session)}`)).toEqual(session)
  })

  it('returns null without logging when the cookie has expired', async () => {
    const sealed = await seal(session, 60)
    vi.useFakeTimers({ now: Date.now() + 2 * 60 * 1000, toFake: ['Date'] })

    expect(await read('/auth/session', `mb_session=${sealed}`)).toBeNull()
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('returns null and logs the reason when the cookie has been tampered with', async () => {
    const sealed = await seal(session)
    const tampered = `${sealed.slice(0, -4)}AAAA`

    expect(await read('/auth/session', `mb_session=${tampered}`)).toBeNull()
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'auth.cookie.rejected',
        cookie: 'mb_session',
        reason: 'invalid',
      }),
      expect.any(String),
    )
  })

  it('returns null when the cookie is not a seal at all', async () => {
    expect(await read('/auth/session', 'mb_session=nimportequoi')).toBeNull()
  })

  it('returns null when the decrypted content is not a session', async () => {
    expect(await read('/auth/session', `mb_session=${await seal({ sub: 'sub-1' })}`)).toBeNull()
  })
})

describe('readPkce', () => {
  it('returns the payload of a valid cookie', async () => {
    expect(await read('/auth/pkce', `mb_pkce=${await seal(pkce)}`)).toEqual(pkce)
  })

  it('returns null when the cookie has been tampered with', async () => {
    const sealed = await seal(pkce)

    expect(await read('/auth/pkce', `mb_pkce=${sealed.slice(0, -4)}AAAA`)).toBeNull()
  })

  it('returns null when the decrypted content is not a PKCE state', async () => {
    expect(await read('/auth/pkce', `mb_pkce=${await seal({ state: 'state-1' })}`)).toBeNull()
  })
})
