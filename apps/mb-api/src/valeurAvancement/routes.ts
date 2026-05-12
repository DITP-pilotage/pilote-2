import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import { indicateurPublicIdSchema } from '@pilote/mb-shared/indicateur'
import { createPaginatedApiListSchema } from '@pilote/mb-shared/pagination'
import {
  individuAvecValeursApiModelSchema,
  listIndividusWithValeursQuerySchema,
  listValeursForIndicateurQuerySchema,
  listValeursRemarquablesForIndicateurQuerySchema,
  valeurAvancementListApiModelSchema,
  valeursRemarquablesListApiModelSchema,
} from '@pilote/mb-shared/valeurAvancement'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { listIndividusWithValeurs } from '@/valeurAvancement/queries/listIndividusWithValeurs'
import { listValeursForIndicateur } from '@/valeurAvancement/queries/listValeursForIndicateur'
import { listValeursRemarquablesForIndicateur } from '@/valeurAvancement/queries/listValeursRemarquablesForIndicateur'

const ValeurAvancementListApiModelSchema = valeurAvancementListApiModelSchema.openapi(
  'ValeurAvancementListApiModel',
)
const IndividusWithValeursListApiModelSchema = createPaginatedApiListSchema(
  individuAvecValeursApiModelSchema,
).openapi('IndividusWithValeursListApiModel')
const ValeursRemarquablesListApiModelSchema = valeursRemarquablesListApiModelSchema.openapi(
  'ValeursRemarquablesListApiModel',
)
const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

const indicateurParamsSchema = z.object({
  id: indicateurPublicIdSchema,
})

// --- GET /indicateurs/:id/valeurs --------------------------------------------

const getValeursForIndicateurRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}/valeurs',
  tags: ['Indicateur'],
  summary: 'Lister les valeurs pour un indicateur sur des individus',
  description:
    "Retourne les valeurs saisies pour l'indicateur sur la liste d'individus fournie. Le paramètre `individus` est obligatoire (1..N identifiants séparés par une virgule, ex. `DEPT-84,DEPT-13`). Filtres optionnels `dateDebut`/`dateFin` (ISO `YYYY-MM-DD`, inclusifs). La réponse n'est pas paginée — le volume est borné par la liste d'individus.",
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    query: listValeursForIndicateurQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ValeurAvancementListApiModelSchema } },
      description: 'Valeurs pour les individus demandés',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides (ex. `individus` absent ou date invalide)',
    },
  },
})

// --- GET /indicateurs/:id/individus ------------------------------------------

const getIndividusWithValeursRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}/individus',
  tags: ['Indicateur'],
  summary: 'Lister les individus disposant de valeurs pour un indicateur',
  description:
    "Retourne la liste paginée des individus ayant au moins une valeur pour l'indicateur. Filtre optionnel `referentiel` pour ne conserver que les individus appartenant à la population d'un référentiel donné. Chaque item inclut la dernière valeur et le nombre total de valeurs.",
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    query: listIndividusWithValeursQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: IndividusWithValeursListApiModelSchema } },
      description: "Individus avec valeurs pour l'indicateur",
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides',
    },
  },
})

// --- GET /indicateurs/:id/valeurs-remarquables -------------------------------

const getValeursRemarquablesForIndicateurRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}/valeurs-remarquables',
  tags: ['Indicateur'],
  summary: 'Lister les valeurs remarquables pour un indicateur sur des individus',
  description:
    "Retourne, pour chaque individu demandé, une vue agrégée des valeurs remarquables de l'indicateur (variation depuis la dernière mise à jour). " +
    'Le paramètre `individus` est obligatoire (1..N identifiants séparés par une virgule, ex. `DEPT-84,DEPT-13`). ' +
    'Les individus inexistants sont omis de la réponse. ' +
    'La variation est calculée sur la base de la date de la valeur (pas de la date de saisie) : null si aucune valeur, ' +
    'égale à la valeur la plus récente si une seule (comparée à 0), sinon différence avec la valeur précédente. ' +
    "La réponse inclut également `min`/`max`/`mediane` calculés sur la valeur la plus récente de l'ensemble des " +
    "individus ayant au moins une valeur pour l'indicateur (indépendamment du paramètre `individus`). " +
    "Ces trois champs sont à `null` si aucun individu n'a de valeur pour l'indicateur.",
  middleware: [requireAuthentication],
  request: {
    params: indicateurParamsSchema,
    query: listValeursRemarquablesForIndicateurQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ValeursRemarquablesListApiModelSchema } },
      description: 'Valeurs remarquables pour les individus demandés',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides (ex. `individus` absent)',
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
  const { referentiel, cursor, pageSize } = context.req.valid('query')

  return listIndividusWithValeurs(id, { referentiel, cursor, pageSize }).match(
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

valeurAvancementRoutes.openapi(getValeursRemarquablesForIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  const { individus } = context.req.valid('query')

  return listValeursRemarquablesForIndicateur(id, { individus }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ValeursRemarquablesListApiModelSchema,
        status: 200,
      }),
    never,
  )
})
