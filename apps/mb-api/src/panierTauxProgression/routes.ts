import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import {
  getPanierTauxProgressionQuerySchema,
  panierTauxProgressionApiModelSchema,
} from '@pilote/mb-shared/panierTauxProgression'
import { panierPublicIdSchema } from '@pilote/mb-shared/publicIds'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { getPanierTauxProgression } from '@/panierTauxProgression/queries/getPanierTauxProgression'

const PanierTauxProgressionApiModelSchema = panierTauxProgressionApiModelSchema.openapi(
  'PanierTauxProgressionApiModel',
)
const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

const panierParamsSchema = z.object({
  id: panierPublicIdSchema,
})

// --- GET /paniers/:id/taux-progression ---------------------------------------

const getPanierTauxProgressionRoute = createRoute({
  method: 'get',
  path: '/paniers/{id}/taux-progression',
  tags: ['Panier'],
  summary: "Récupérer le taux de progression agrégé d'un panier pour un individu",
  description:
    "Retourne la moyenne pondérée du dernier taux de progression connu de chaque indicateur " +
    "du panier pour l'individu demandé. La pondération est fixée à 1 par indicateur en v0 " +
    '(constante côté serveur). Règle tout-ou-rien : si au moins un indicateur du panier ' +
    "n'a pas de dernier taux calculable (aucun objectif, aucune valeur, ou dernier point avec " +
    '`valeurCible = 0`), le champ `tauxProgression` global vaut `null`. Le tableau ' +
    '`contributions` est toujours renseigné, ce qui permet au client d\'identifier les ' +
    'indicateurs bloquants. Granularité de troncature fixée à `month` (cf. ' +
    "`docs/architecture/taux-progression.md`). Le taux est tronqué à 2 décimales (ROUND_DOWN) " +
    'pour préserver la sémantique « ne jamais afficher 100 % avant atteinte stricte ».',
  middleware: [requireAuthentication],
  request: {
    params: panierParamsSchema,
    query: getPanierTauxProgressionQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: PanierTauxProgressionApiModelSchema } },
      description: "Taux de progression du panier pour l'individu demandé",
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides',
    },
  },
})

// --- App registration --------------------------------------------------------

export const panierTauxProgressionRoutes = new OpenAPIHono()

panierTauxProgressionRoutes.openapi(getPanierTauxProgressionRoute, async (context) => {
  const { id } = context.req.valid('param')
  const query = context.req.valid('query')

  return getPanierTauxProgression(id, query).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: PanierTauxProgressionApiModelSchema,
        status: 200,
      }),
    never,
  )
})
