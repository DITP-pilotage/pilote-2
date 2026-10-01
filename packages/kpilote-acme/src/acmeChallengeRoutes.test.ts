import { describe, expect, it } from 'vitest'

import { createAcmeChallengeRoutes } from './acmeChallengeRoutes'

const UPLOAD_API_KEY = 'test-acme-upload-key'

const deposer = ({
  routes,
  body,
  authorization = `Bearer ${UPLOAD_API_KEY}`,
}: {
  routes: ReturnType<typeof createAcmeChallengeRoutes>
  body: string
  authorization?: string
}) =>
  routes.request('/api/acme/challenge', {
    method: 'POST',
    headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    body,
  })

describe('createAcmeChallengeRoutes', () => {
  describe('GET /.well-known/acme-challenge/:token', () => {
    it('sert la keyAuthorization déposée en text/plain, sans cache', async () => {
      const routes = createAcmeChallengeRoutes({ uploadApiKey: UPLOAD_API_KEY })
      await deposer({
        routes,
        body: JSON.stringify({ token: 'abc_-1', keyAuthorization: 'abc_-1.thumb' }),
      })

      const response = await routes.request('/.well-known/acme-challenge/abc_-1')

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toMatch(/^text\/plain/)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(await response.text()).toBe('abc_-1.thumb')
    })

    it('renvoie 404 quand le token est inconnu', async () => {
      const routes = createAcmeChallengeRoutes({ uploadApiKey: UPLOAD_API_KEY })

      const response = await routes.request('/.well-known/acme-challenge/inconnu')

      expect(response.status).toBe(404)
    })

    it('isole les challenges entre deux instances', async () => {
      const premieres = createAcmeChallengeRoutes({ uploadApiKey: UPLOAD_API_KEY })
      const secondes = createAcmeChallengeRoutes({ uploadApiKey: UPLOAD_API_KEY })
      await deposer({
        routes: premieres,
        body: JSON.stringify({ token: 'abc', keyAuthorization: 'abc.thumb' }),
      })

      const response = await secondes.request('/.well-known/acme-challenge/abc')

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/acme/challenge', () => {
    it('stocke le challenge et renvoie 201', async () => {
      const routes = createAcmeChallengeRoutes({ uploadApiKey: UPLOAD_API_KEY })

      const response = await deposer({
        routes,
        body: JSON.stringify({ token: 'abc', keyAuthorization: 'abc.thumb' }),
      })

      expect(response.status).toBe(201)
      expect(await response.json()).toEqual({ token: 'abc', stored: true })
    })

    it('renvoie 401 sans Bearer', async () => {
      const routes = createAcmeChallengeRoutes({ uploadApiKey: UPLOAD_API_KEY })

      const response = await routes.request('/api/acme/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'abc', keyAuthorization: 'abc.thumb' }),
      })

      expect(response.status).toBe(401)
    })

    it('renvoie 401 avec une mauvaise clé, sans stocker le challenge', async () => {
      const routes = createAcmeChallengeRoutes({ uploadApiKey: UPLOAD_API_KEY })

      const response = await deposer({
        routes,
        authorization: 'Bearer mauvaise-cle',
        body: JSON.stringify({ token: 'abc', keyAuthorization: 'abc.thumb' }),
      })

      expect(response.status).toBe(401)
      expect((await routes.request('/.well-known/acme-challenge/abc')).status).toBe(404)
    })

    it("renvoie 503 quand la clé d'upload n'est pas configurée", async () => {
      const routes = createAcmeChallengeRoutes({ uploadApiKey: undefined })

      const response = await deposer({
        routes,
        body: JSON.stringify({ token: 'abc', keyAuthorization: 'abc.thumb' }),
      })

      expect(response.status).toBe(503)
    })

    it("renvoie 503 quand la clé d'upload est vide", async () => {
      const routes = createAcmeChallengeRoutes({ uploadApiKey: '' })

      const response = await deposer({
        routes,
        authorization: 'Bearer ',
        body: JSON.stringify({ token: 'abc', keyAuthorization: 'abc.thumb' }),
      })

      expect(response.status).toBe(503)
    })

    it("renvoie 400 quand le body n'est pas du JSON", async () => {
      const routes = createAcmeChallengeRoutes({ uploadApiKey: UPLOAD_API_KEY })

      const response = await deposer({ routes, body: 'pas-du-json' })

      expect(response.status).toBe(400)
    })

    it('renvoie 400 quand keyAuthorization manque', async () => {
      const routes = createAcmeChallengeRoutes({ uploadApiKey: UPLOAD_API_KEY })

      const response = await deposer({ routes, body: JSON.stringify({ token: 'abc' }) })

      expect(response.status).toBe(400)
    })

    it("renvoie 400 quand le token n'est pas en base64url", async () => {
      const routes = createAcmeChallengeRoutes({ uploadApiKey: UPLOAD_API_KEY })

      const response = await deposer({
        routes,
        body: JSON.stringify({ token: '../etc', keyAuthorization: 'x' }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/acme/challenge/:token', () => {
    it('supprime le challenge et renvoie 204', async () => {
      const routes = createAcmeChallengeRoutes({ uploadApiKey: UPLOAD_API_KEY })
      await deposer({
        routes,
        body: JSON.stringify({ token: 'abc', keyAuthorization: 'abc.thumb' }),
      })

      const response = await routes.request('/api/acme/challenge/abc', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${UPLOAD_API_KEY}` },
      })

      expect(response.status).toBe(204)
      expect((await routes.request('/.well-known/acme-challenge/abc')).status).toBe(404)
    })

    it('renvoie 401 sans Bearer, sans supprimer le challenge', async () => {
      const routes = createAcmeChallengeRoutes({ uploadApiKey: UPLOAD_API_KEY })
      await deposer({
        routes,
        body: JSON.stringify({ token: 'abc', keyAuthorization: 'abc.thumb' }),
      })

      const response = await routes.request('/api/acme/challenge/abc', { method: 'DELETE' })

      expect(response.status).toBe(401)
      expect((await routes.request('/.well-known/acme-challenge/abc')).status).toBe(200)
    })
  })
})
