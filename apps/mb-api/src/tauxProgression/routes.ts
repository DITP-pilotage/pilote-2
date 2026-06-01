import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import { indicateurPublicIdSchema } from '@pilote/mb-shared/indicateur'
import {
  listTauxProgressionQuerySchema,
  tauxProgressionListApiModelSchema,
} from '@pilote/mb-shared/tauxProgression'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { listTauxProgressionForIndicateur } from '@/tauxProgression/queries/listTauxProgressionForIndicateur'

const TauxProgressionListApiModelSchema = tauxProgressionListApiModelSchema.openapi(
  'TauxProgressionListApiModel',
)
const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

const indicateurParamsSchema = z.object({
  id: indicateurPublicIdSchema,
})

// --- GET /indicateurs/:id/taux-progression -----------------------------------

const getTauxProgressionRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}/taux-progression',
  tags: ['Indicateur'],
  summary: "Lister le taux de progression par valeur d'avancement pour des individus",
  description:
    "Retourne, pour chaque saisie des individus demandés, le taux de progression calculé " +
    "comme `min(100, valeur / valeurCible × 100)` où `valeurCible` est celle de l'objectif " +
    "applicable à la date de la saisie. L'objectif applicable est le premier objectif dont " +
    "`dateCible` est strictement supérieure à la date de la saisie ; si la saisie est " +
    "postérieure à tous les objectifs, le dernier objectif connu est retenu. " +
    "Les individus sans aucun objectif sont absents de la réponse. " +
    "Les dates sont brutes (pas de troncature). " +
    "Triés par `(individu publicId asc, date asc)`.",
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    query: listTauxProgressionQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: TauxProgressionListApiModelSchema } },
      description: 'Taux de progression pour les individus demandés',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides',
    },
  },
})

// --- App registration --------------------------------------------------------

export const tauxProgressionRoutes = new OpenAPIHono()

tauxProgressionRoutes.openapi(getTauxProgressionRoute, async (context) => {
  const { id } = context.req.valid('param')
  const query = context.req.valid('query')

  return listTauxProgressionForIndicateur(id, query).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: TauxProgressionListApiModelSchema,
        status: 200,
      }),
    never,
  )
})
