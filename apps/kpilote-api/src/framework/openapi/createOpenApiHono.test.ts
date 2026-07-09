import { createRoute, z } from '@hono/zod-openapi'
import { describe, expect, it } from 'vitest'

import { registerErrorHandler } from '@/framework/errors/errorHandler'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'

const buildApp = () => {
  const routes = createOpenApiHono()

  routes.openapi(
    createRoute({
      method: 'post',
      path: '/test-validation',
      request: {
        body: {
          content: {
            'application/json': {
              schema: z.object({ date: z.string().date() }),
            },
          },
        },
      },
      responses: {
        200: { description: 'ok', content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } } },
      },
    }),
    (c) => c.json({ ok: true }, 200),
  )

  const app = createOpenApiHono()
  app.route('/', routes)
  registerErrorHandler(app)
  return app
}

describe('createOpenApiHono — defaultHook route les ZodError vers onError', () => {
  it('renvoie 400 avec code VALIDATION_ERROR et details.issues quand le body est invalide', async () => {
    const app = buildApp()

    const response = await app.request('/test-validation', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ date: 'pas-une-date' }),
    })

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body).not.toHaveProperty('success')
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.details.issues).toBeDefined()
    expect(body.details.issues.length).toBeGreaterThan(0)
  })

  it('renvoie 200 quand le body est valide', async () => {
    const app = buildApp()

    const response = await app.request('/test-validation', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ date: '2024-01-15' }),
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)
  })
})
