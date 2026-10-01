// @vitest-environment node
import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'

const { ACME_UPLOAD_API_KEY } = vi.hoisted(() => ({ ACME_UPLOAD_API_KEY: 'test-acme-upload-key' }))

vi.mock('@/server/env', () => ({
  serverEnv: { VITE_API_URL: 'https://kpilote-api.example.test', ACME_UPLOAD_API_KEY },
}))
vi.mock('@/server/auth/router', () => ({ authRouter: new Hono() }))

const { app } = await import('./app')

describe('challenge ACME sur le serveur de la webapp', () => {
  it('dépose, sert puis supprime le challenge', async () => {
    const depot = await app.request('/api/acme/challenge', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACME_UPLOAD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: 'kpilote-webapp-token', keyAuthorization: 'webapp.thumb' }),
    })
    const lecture = await app.request('/.well-known/acme-challenge/kpilote-webapp-token')
    const suppression = await app.request('/api/acme/challenge/kpilote-webapp-token', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ACME_UPLOAD_API_KEY}` },
    })
    const lectureApresSuppression = await app.request(
      '/.well-known/acme-challenge/kpilote-webapp-token',
    )

    expect(depot.status).toBe(201)
    expect(lecture.status).toBe(200)
    expect(await lecture.text()).toBe('webapp.thumb')
    expect(suppression.status).toBe(204)
    expect(lectureApresSuppression.status).toBe(404)
  })
})
