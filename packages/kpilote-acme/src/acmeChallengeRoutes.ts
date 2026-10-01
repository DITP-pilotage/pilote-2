import { Hono, type MiddlewareHandler } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import { z } from 'zod'

// Les tokens ACME sont en base64url (RFC 8555 §8.1).
const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]+$/)

const challengeBodySchema = z.object({
  token: tokenSchema,
  keyAuthorization: z.string().min(1),
})

const uploadNotConfigured: MiddlewareHandler = (context) =>
  Promise.resolve(context.json({ error: 'ACME upload endpoint not configured' }, 503))

/**
 * Routes du challenge ACME HTTP-01, pilotées par le workflow de renouvellement SSL
 * (certbot + scripts/acme/*.sh) :
 * - `POST /api/acme/challenge` et `DELETE /api/acme/challenge/:token` (Bearer
 *   `uploadApiKey`) déposent et suppriment la keyAuthorization ;
 * - `GET /.well-known/acme-challenge/:token` (public) la sert à la CA.
 *
 * Le store est une Map en mémoire, propre à chaque process : le renouvellement
 * suppose un seul dyno web. Sans `uploadApiKey`, le dépôt répond 503.
 */
export const createAcmeChallengeRoutes = ({
  uploadApiKey,
}: {
  uploadApiKey: string | undefined
}) => {
  const challenges = new Map<string, string>()
  const onlyUploadApiKey = uploadApiKey ? bearerAuth({ token: uploadApiKey }) : uploadNotConfigured

  const routes = new Hono()

  routes.get('/.well-known/acme-challenge/:token', (context) => {
    const keyAuthorization = challenges.get(context.req.param('token'))
    if (keyAuthorization === undefined) {
      return context.text('Not found', 404)
    }
    return context.text(keyAuthorization, 200, { 'Cache-Control': 'no-store' })
  })

  routes.post('/api/acme/challenge', onlyUploadApiKey, async (context) => {
    const payload: unknown = await context.req.json().catch(() => null)
    const body = challengeBodySchema.safeParse(payload)
    if (!body.success) {
      return context.json({ error: 'Invalid body' }, 400)
    }
    challenges.set(body.data.token, body.data.keyAuthorization)
    return context.json({ token: body.data.token, stored: true }, 201)
  })

  routes.delete('/api/acme/challenge/:token', onlyUploadApiKey, (context) => {
    challenges.delete(context.req.param('token'))
    return context.body(null, 204)
  })

  return routes
}
