import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import {
  createPaginatedApiListSchema,
  errorApiModelSchema,
  indicateurPublicIdSchema,
  individuAvecObservationsApiModelSchema,
  listIndividusWithValeursQuerySchema,
  listValeursForIndicateurQuerySchema,
  valeurAvancementListApiModelSchema,
} from '@pilote/mb-shared/api'

import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { listIndividusWithValeurs } from '@/valeurAvancement/queries/listIndividusWithValeurs'
import { listValeursForIndicateur } from '@/valeurAvancement/queries/listValeursForIndicateur'

const ValeurAvancementListApiModelSchema = valeurAvancementListApiModelSchema.openapi(
  'ValeurAvancementListApiModel',
)
const IndividusWithValeursListApiModelSchema = createPaginatedApiListSchema(
  individuAvecObservationsApiModelSchema,
).openapi('IndividusWithValeursListApiModel')
const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

const indicateurParamsSchema = z.object({
  id: indicateurPublicIdSchema,
})

// --- GET /indicateurs/:id/valeurs --------------------------------------------

const getValeursForIndicateurRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}/valeurs',
  tags: ['Indicateur'],
  summary: 'Lister les valeurs observées pour un indicateur sur des individus',
  description:
    "Retourne les observations (valeurs saisies) pour l'indicateur sur la liste d'individus fournie. Le paramètre `individus` est obligatoire (1..N identifiants séparés par une virgule, ex. `Dept-84,Dept-13`). Filtres optionnels `dateDebut`/`dateFin` (ISO `YYYY-MM-DD`, inclusifs). La réponse n'est pas paginée — le volume est borné par la liste d'individus.",
  request: {
    params: indicateurParamsSchema,
    query: listValeursForIndicateurQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ValeurAvancementListApiModelSchema } },
      description: 'Observations pour les individus demandés',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides (ex. `individus` absent ou date invalide)',
    },
    404: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Indicateur introuvable',
    },
  },
})

// --- GET /indicateurs/:id/individus ------------------------------------------

const getIndividusWithValeursRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}/individus',
  tags: ['Indicateur'],
  summary: "Lister les individus disposant d'observations pour un indicateur",
  description:
    "Retourne la liste paginée des individus ayant au moins une observation pour l'indicateur. Filtre optionnel `referentiel` pour ne conserver que les individus appartenant à la population d'un référentiel donné. Chaque item inclut la dernière observation et le nombre total d'observations.",
  request: {
    params: indicateurParamsSchema,
    query: listIndividusWithValeursQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: IndividusWithValeursListApiModelSchema } },
      description: "Individus avec observations pour l'indicateur",
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides',
    },
    404: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Indicateur ou référentiel introuvable',
    },
  },
})

// --- App registration --------------------------------------------------------

export const valeurAvancementRoutes = new OpenAPIHono()

valeurAvancementRoutes.openapi(getValeursForIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  const { individus, dateDebut, dateFin } = context.req.valid('query')

  return listValeursForIndicateur(id, { individus, dateDebut, dateFin }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ValeurAvancementListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

valeurAvancementRoutes.openapi(getIndividusWithValeursRoute, async (context) => {
  const { id } = context.req.valid('param')
  const { referentiel, cursor } = context.req.valid('query')

  return listIndividusWithValeurs(id, { referentiel, cursor }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: IndividusWithValeursListApiModelSchema,
        status: 200,
      }),
    never,
  )
})
