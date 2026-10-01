import { describe, expect, it, vi } from 'vitest'

import { app } from '../app'
import { logger } from '@/framework/logger/logger'

// Valeur de ACME_UPLOAD_API_KEY dans .env.test.
const UPLOAD_API_KEY = 'test-acme-upload-key'

describe('challenge ACME sur l’app complète', () => {
  it('dépose, sert puis supprime le challenge sans passer par l’authentification', async () => {
    const warn = vi.spyOn(logger, 'warn')

    const depot = await app.request('/api/acme/challenge', {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPLOAD_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'kpilote-api-token', keyAuthorization: 'kpilote-api.thumb' }),
    })
    const lecture = await app.request('/.well-known/acme-challenge/kpilote-api-token')
    const suppression = await app.request('/api/acme/challenge/kpilote-api-token', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${UPLOAD_API_KEY}` },
    })
    const lectureApresSuppression = await app.request(
      '/.well-known/acme-challenge/kpilote-api-token',
    )

    expect(depot.status).toBe(201)
    expect(lecture.status).toBe(200)
    expect(await lecture.text()).toBe('kpilote-api.thumb')
    expect(suppression.status).toBe(204)
    expect(lectureApresSuppression.status).toBe(404)
    // Monté après authContext, le Bearer ACME serait vérifié comme un JWT.
    expect(warn).not.toHaveBeenCalled()
  })
})
