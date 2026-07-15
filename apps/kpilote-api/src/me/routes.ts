import { createRoute } from '@hono/zod-openapi'
import { meApiModelSchema } from '@pilote/kpilote-shared/me'
import { meFeatureFlippingApiModelSchema } from '@pilote/kpilote-shared/meFeatureFlipping'
import { mePermissionsApiModelSchema } from '@pilote/kpilote-shared/mePermissions'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { requireUser } from '@/framework/auth/userContext'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { listerMesFeatureFlippings } from '@/me/queries/listerMesFeatureFlippings'
import { listerMesPermissions } from '@/me/queries/listerMesPermissions'

const MeOkSchema = meApiModelSchema.openapi('Me')
const MePermissionsOkSchema = mePermissionsApiModelSchema.openapi('MePermissions')
const MeFeatureFlippingOkSchema = meFeatureFlippingApiModelSchema.openapi('MeFeatureFlipping')

const meRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Authentication'],
  summary: "Renvoyer l'utilisateur authentifié",
  middleware: [requireAuthentication],
  responses: {
    200: {
      content: { 'application/json': { schema: MeOkSchema } },
      description: 'Utilisateur authentifié',
    },
  },
})

const mePermissionsRoute = createRoute({
  method: 'get',
  path: '/me/permissions',
  tags: ['Authentication'],
  summary: 'Renvoyer les permissions explicites du principal courant',
  description:
    'Permet au client de gater son UI sans envoyer une mutation pour découvrir un 403. ' +
    "N'inclut PAS le READ implicite des ressources `PUBLIC` (le client le sait en affichant " +
    'la ressource). Pour les API keys de rôle ADMIN, renvoie `{ isAdmin: true, paniers: [], ' +
    'indicateurs: [] }` ; le client doit alors considérer toute action autorisée.',
  middleware: [requireAuthentication],
  responses: {
    200: {
      content: { 'application/json': { schema: MePermissionsOkSchema } },
      description: 'Permissions du principal courant',
    },
  },
})

const meFeatureFlippingRoute = createRoute({
  method: 'get',
  path: '/me/feature-flipping',
  tags: ['Authentication'],
  summary: 'Feature flippings actifs pour l’utilisateur courant',
  middleware: [requireAuthentication],
  responses: {
    200: {
      content: { 'application/json': { schema: MeFeatureFlippingOkSchema } },
      description: 'Clés des feature flippings actifs',
    },
  },
})

export const meRoutes = createOpenApiHono()

meRoutes.openapi(meRoute, (context) => {
  const user = requireUser()
  return jsonResponseOk({
    context,
    data: {
      userId: user.id,
      prenom: user.prenom,
      nom: user.nom,
    },
    schema: MeOkSchema,
    status: 200,
  })
})

meRoutes.openapi(mePermissionsRoute, async (context) =>
  listerMesPermissions().match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: MePermissionsOkSchema,
        status: 200,
      }),
    never,
  ),
)

meRoutes.openapi(meFeatureFlippingRoute, async (context) =>
  listerMesFeatureFlippings().match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: MeFeatureFlippingOkSchema,
        status: 200,
      }),
    never,
  ),
)
