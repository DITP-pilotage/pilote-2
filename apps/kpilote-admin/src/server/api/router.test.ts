// @vitest-environment node
import type { AddressInfo } from 'node:net'

import { serve, type ServerType } from '@hono/node-server'
import { Hono } from 'hono'
import { sealData } from 'iron-session'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import type { AdminSession } from '@/server/session'

import { apiRouter } from './router'

const { upstream, SESSION_SECRET } = vi.hoisted(() => ({
  upstream: { url: '' },
  SESSION_SECRET: 'secret-de-test-suffisamment-long-pour-iron',
}))

vi.mock('@/server/env', () => ({ serverEnv: { SESSION_SECRET } }))
vi.mock('@/server/environments', () => ({
  ENVIRONMENTS: ['local', 'dev', 'prod'],
  kpiloteApiUrlFor: () => upstream.url,
}))

type Received = { method: string; contentType: string | null; body: string }

const echoApp = new Hono().all('/*', async (context) =>
  context.json<Received>({
    method: context.req.method,
    contentType: context.req.header('content-type') ?? null,
    body: await context.req.text(),
  }),
)

const listen = (fetch: Hono['fetch']) =>
  new Promise<{ server: ServerType; url: string }>((resolve) => {
    const server = serve({ fetch, port: 0 }, (info: AddressInfo) => {
      resolve({ server, url: `http://localhost:${info.port}` })
    })
  })

const session: AdminSession = { environment: 'dev', apiKey: 'kp_dev_123', label: 'Clé dev' }

let proxyUrl = ''
let cookie = ''
const servers: ServerType[] = []

beforeAll(async () => {
  const echo = await listen(echoApp.fetch)
  upstream.url = echo.url
  const proxy = await listen(new Hono().route('/api', apiRouter).fetch)
  proxyUrl = proxy.url
  servers.push(echo.server, proxy.server)
  cookie = `mbadmin_session=${await sealData(session, { password: SESSION_SECRET, ttl: 3600 })}`
})

afterAll(() => {
  for (const server of servers) server.close()
})

const send = async (method: string, body?: string): Promise<Received> => {
  const response = await fetch(
    `${proxyUrl}/api/indicateurs/ind_test`,
    body === undefined
      ? { method, headers: { cookie } }
      : { method, headers: { cookie, 'content-type': 'application/json' }, body },
  )
  expect(response.status).toBe(200)
  return (await response.json()) as Received
}

describe('apiRouter served by @hono/node-server', () => {
  it('relays a large JSON body byte for byte', async () => {
    const rows = Array.from({ length: 1000 }, (_, index) => ({
      individu: `Préfecture n°${index}`,
      date: '2026-10-29',
      valeur: index * 1.5,
    }))
    const body = JSON.stringify({ rows, nomFichier: 'données été.csv' })

    expect(await send('PUT', body)).toEqual({
      method: 'PUT',
      contentType: 'application/json',
      body,
    })
  })

  it('relays a DELETE without body as an empty body', async () => {
    expect(await send('DELETE')).toEqual({
      method: 'DELETE',
      contentType: 'application/json',
      body: '',
    })
  })

  it('does not forward a body on GET', async () => {
    expect(await send('GET')).toEqual({ method: 'GET', contentType: null, body: '' })
  })
})
