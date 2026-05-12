import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { errorApiModelSchema } from '@pilote/mb-shared/error'
import {
  indicateurApiModelSchema,
  indicateurPublicIdSchema,
  listIndicateursQuerySchema,
  upsertIndicateurBodySchema,
} from '@pilote/mb-shared/indicateur'
import { createPaginatedApiListSchema } from '@pilote/mb-shared/pagination'
import { referentielApiModelSchema } from '@pilote/mb-shared/referentiel'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { upsertIndicateur } from '@/indicateur/commands/upsertIndicateur'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'
import { listReferentielsForIndicateur } from '@/indicateur/queries/listReferentielsForIndicateur'

const IndicateurApiModelSchema = indicateurApiModelSchema.openapi('IndicateurApiModel')
const IndicateurListApiModelSchema =
  createPaginatedApiListSchema(indicateurApiModelSchema).openapi('IndicateurListApiModel')
const UpsertIndicateurBodySchema = upsertIndicateurBodySchema.openapi('UpsertIndicateurBody')
const ReferentielsForIndicateurApiModelSchema = z
  .object({ items: z.array(referentielApiModelSchema) })
  .openapi('ReferentielsForIndicateurApiModel')
export const ErrorApiModelSchema = errorApiModelSchema.openapi('ErrorApiModel')

// --- GET /indicateurs --------------------------------------------------------

const getIndicateursRoute = createRoute({
  method: 'get',
  path: '/indicateurs',
  tags: ['Indicateur'],
  summary: 'Lister les indicateurs',
  description:
    "Retourne la liste paginée des indicateurs avec un filtre de recherche par nom. La pagination est cursor-based : passez `cursor` (renvoyé dans la réponse précédente) pour obtenir la page suivante. `hasMore` indique s'il reste des pages. Chaque item inclut `referentielIds` (triés par identifiant public ASC).",
  middleware: [requireAuthentication],
  request: { query: listIndicateursQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurListApiModelSchema } },
      description: 'Liste paginée des indicateurs',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Paramètres de requête invalides',
    },
  },
})

// --- GET /indicateurs/:id ----------------------------------------------------

const detailParamsSchema = z.object({
  id: indicateurPublicIdSchema,
})

const getIndicateurByIdRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}',
  tags: ['Indicateur'],
  summary: 'Récupérer un indicateur par identifiant public',
  description:
    "Retourne un indicateur identifié par son identifiant public (format `IND-XXX`). La réponse inclut `referentielIds` (référentiels liés, triés par publicId ASC). Renvoie 404 (`ENTITY_NOT_FOUND`) si aucun indicateur ne correspond.",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurApiModelSchema } },
      description: 'Indicateur trouvé',
    },
    404: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Indicateur introuvable',
    },
  },
})

// --- PUT /indicateurs/:id ----------------------------------------------------

const upsertIndicateurRoute = createRoute({
  method: 'put',
  path: '/indicateurs/{id}',
  tags: ['Indicateur'],
  summary: 'Créer ou remplacer un indicateur (nom + référentiels liés)',
  description:
    "Crée l'indicateur s'il n'existe pas, ou met à jour son `nom` si déjà présent. Le champ `referentielIds` est obligatoire et applique une sémantique replace-all : l'ensemble des liens devient strictement celui décrit dans le body (tableau vide pour aucun lien). Les doublons sont silencieusement dédupliqués. Si un `referentielId` n'existe pas, l'appel échoue avec 400 `VALIDATION_ERROR` et `details.unknownReferentielIds`. L'opération est atomique (transaction unique).",
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    body: {
      content: { 'application/json': { schema: UpsertIndicateurBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurApiModelSchema } },
      description: 'Indicateur créé ou mis à jour',
    },
    400: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Requête invalide (body ou référentiels inconnus)',
    },
  },
})

// --- GET /indicateurs/:id/referentiels --------------------------------------

const getReferentielsForIndicateurRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{id}/referentiels',
  tags: ['Indicateur'],
  summary: "Lister les référentiels liés à un indicateur",
  description:
    "Retourne les ressources complètes des référentiels liés à l'indicateur, triées par identifiant public ASC. Réponse non paginée (le volume est borné par le nombre de référentiels liés à un indicateur).",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: ReferentielsForIndicateurApiModelSchema } },
      description: "Référentiels liés à l'indicateur (peut être vide)",
    },
    404: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Indicateur introuvable',
    },
  },
})

// --- App registration --------------------------------------------------------

export const indicateurRoutes = new OpenAPIHono()

indicateurRoutes.openapi(getIndicateursRoute, async (context) => {
  const { recherche, cursor, pageSize } = context.req.valid('query')

  return listIndicateurs({ recherche, cursor, pageSize }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: IndicateurListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

indicateurRoutes.openapi(getIndicateurByIdRoute, async (context) => {
  const { id } = context.req.valid('param')

  return getIndicateurByPublicId(id).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: IndicateurApiModelSchema,
        status: 200,
      }),
    never,
  )
})

indicateurRoutes.openapi(upsertIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  const result = await withTransaction(async () => {
    await upsertIndicateur({ publicId: id, body })
    return getIndicateurByPublicId(id)
  })

  return result.match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: IndicateurApiModelSchema,
        status: 200,
      }),
    never,
  )
})

indicateurRoutes.openapi(getReferentielsForIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')

  return listReferentielsForIndicateur(id).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: ReferentielsForIndicateurApiModelSchema,
        status: 200,
      }),
    never,
  )
})
