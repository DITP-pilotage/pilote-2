import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { requirePrincipal } from '@/framework/auth/userContext'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'

const WhoamiOkSchema = z
  .object({
    kind: z.enum(['user', 'apiKey']),
    label: z.string(),
  })
  .openapi('Whoami')

const whoamiRoute = createRoute({
  method: 'get',
  path: '/auth/whoami',
  tags: ['Authentication'],
  summary: "Valider l'authentification courante (utilisateur ou API key)",
  description:
    "Renvoie l'identité du principal courant. Contrairement à `/me`, accepte aussi les " +
    'API keys. Sert de validation de clé : 200 si la clé est valide (non révoquée, non ' +
    'expirée), 401 sinon.',
  middleware: [requireAuthentication],
  responses: {
    200: {
      content: { 'application/json': { schema: WhoamiOkSchema } },
      description: 'Principal authentifié',
    },
  },
})

export const whoami = new OpenAPIHono()

whoami.openapi(whoamiRoute, (context) => {
  const principal = requirePrincipal()
  const label =
    principal.kind === 'user'
      ? `${principal.user.prenom} ${principal.user.nom}`
      : principal.apiKey.label
  return jsonResponseOk({
    context,
    data: { kind: principal.kind, label },
    schema: WhoamiOkSchema,
    status: 200,
  })
})
