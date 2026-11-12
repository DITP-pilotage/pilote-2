import { createRoute, z } from '@hono/zod-openapi'
import {
  axeApiModelSchema,
  axeListApiModelSchema,
  axePublicIdSchema,
  listAxesQuerySchema,
  modaliteApiModelSchema,
  modaliteListApiModelSchema,
  modalitePublicIdSchema,
  upsertAxeBodySchema,
  upsertModaliteBodySchema,
} from '@pilote/kpilote-shared/axe'

import { deleteModalite } from '@/axe/commands/deleteModalite'
import { type UpsertAxeError, upsertAxe } from '@/axe/commands/upsertAxe'
import { type UpsertModaliteError, upsertModalite } from '@/axe/commands/upsertModalite'
import { getAxeByPublicId } from '@/axe/queries/getAxeByPublicId'
import { getModaliteByPublicId } from '@/axe/queries/getModaliteByPublicId'
import { listAxes } from '@/axe/queries/listAxes'
import { listModalitesForAxe } from '@/axe/queries/listModalitesForAxe'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import {
  ErrorApiModelSchema,
  erreur400,
  erreur403,
  erreur404,
  erreur409,
} from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'

const AxeApiModelSchema = axeApiModelSchema.openapi('AxeApiModel')
const AxeListApiModelSchema = axeListApiModelSchema.openapi('AxeListApiModel')
const UpsertAxeBodySchema = upsertAxeBodySchema.openapi('UpsertAxeBody')
const ModaliteApiModelSchema = modaliteApiModelSchema.openapi('ModaliteApiModel')
const ModaliteListApiModelSchema = modaliteListApiModelSchema.openapi('ModaliteListApiModel')
const UpsertModaliteBodySchema = upsertModaliteBodySchema.openapi('UpsertModaliteBody')

const axeParamsSchema = z.object({ id: axePublicIdSchema })
const modaliteParamsSchema = z.object({ id: axePublicIdSchema, modaliteId: modalitePublicIdSchema })

const ADMIN = 'Réservé aux clés API de rôle `ADMIN` (403 sinon).'

// --- GET /axes ---------------------------------------------------------------

const listAxesRoute = createRoute({
  method: 'get',
  path: '/axes',
  tags: ['Axe'],
  summary: 'Lister les axes',
  description:
    'Retourne la liste paginée des axes (découpages définis par l’utilisateur, ex. Opérateur, Type de fraude), avec leurs niveaux et leur nombre de modalités. Filtre `recherche` sur le nom. Pagination cursor-based.',
  middleware: [requireAuthentication],
  request: { query: listAxesQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: AxeListApiModelSchema } },
      description: 'Liste paginée des axes',
    },
    400: erreur400,
  },
})

// --- GET /axes/:id -----------------------------------------------------------

const getAxeRoute = createRoute({
  method: 'get',
  path: '/axes/{id}',
  tags: ['Axe'],
  summary: 'Récupérer un axe',
  description: 'Retourne un axe et ses niveaux, triés par ordre.',
  middleware: [requireAuthentication],
  request: { params: axeParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: AxeApiModelSchema } },
      description: 'Axe trouvé',
    },
    404: erreur404,
  },
})

// --- PUT /axes/:id -----------------------------------------------------------

const upsertAxeRoute = createRoute({
  method: 'put',
  path: '/axes/{id}',
  tags: ['Axe', 'Admin'],
  summary: 'Créer ou modifier un axe et ses niveaux',
  description: `${ADMIN} Crée l’axe s’il n’existe pas, sinon met à jour son nom et sa description. \`niveaux\` est la liste complète des niveaux, du plus large au plus fin : la position donne l’ordre, un niveau existant à cette position est renommé. Raccourcir la liste supprime les derniers niveaux ; c’est refusé (409 \`NIVEAU_PORTE_MODALITES\`) si l’un d’eux porte des modalités. Changer le nombre de niveaux d’un axe déclaré par un indicateur est refusé (409 \`AXE_UTILISE\`). Exécuté dans une transaction.`,
  middleware: [requireAuthentication],
  request: {
    params: axeParamsSchema,
    body: { content: { 'application/json': { schema: UpsertAxeBodySchema } }, required: true },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: AxeApiModelSchema } },
      description: 'Axe créé ou mis à jour',
    },
    400: erreur400,
    403: erreur403,
    409: erreur409,
  },
})

// --- GET /axes/:id/modalites -------------------------------------------------

const listModalitesRoute = createRoute({
  method: 'get',
  path: '/axes/{id}/modalites',
  tags: ['Axe'],
  summary: 'Lister les modalités d’un axe',
  description:
    'Retourne toutes les modalités de l’axe, sans pagination, triées par niveau puis par nom. Chaque modalité indique son niveau et son parent : l’arbre se reconstruit à partir de `parent`.',
  middleware: [requireAuthentication],
  request: { params: axeParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: ModaliteListApiModelSchema } },
      description: 'Modalités de l’axe',
    },
    404: erreur404,
  },
})

// --- PUT /axes/:id/modalites/:modaliteId -------------------------------------

const upsertModaliteRoute = createRoute({
  method: 'put',
  path: '/axes/{id}/modalites/{modaliteId}',
  tags: ['Axe', 'Admin'],
  summary: 'Créer ou renommer une modalité',
  description: `${ADMIN} Crée la modalité si elle n’existe pas, sinon la renomme. Son niveau se déduit de \`parent\` : premier niveau sans parent, sinon niveau du parent + 1. Le parent est fixé à la création : pour déplacer une modalité, la supprimer puis la recréer. Identifiant unique tous axes confondus. Erreurs : 400 \`PARENT_INCONNU\`, \`PARENT_AUTRE_AXE\`, \`NIVEAU_INEXISTANT\` (le parent est au dernier niveau) ; 409 \`MODALITE_AUTRE_AXE\` (identifiant pris dans un autre axe), \`CHANGEMENT_PARENT_INTERDIT\`.`,
  middleware: [requireAuthentication],
  request: {
    params: modaliteParamsSchema,
    body: {
      content: { 'application/json': { schema: UpsertModaliteBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ModaliteApiModelSchema } },
      description: 'Modalité créée ou renommée',
    },
    400: erreur400,
    403: erreur403,
    404: erreur404,
    409: erreur409,
  },
})

// --- DELETE /axes/:id/modalites/:modaliteId ----------------------------------

const deleteModaliteRoute = createRoute({
  method: 'delete',
  path: '/axes/{id}/modalites/{modaliteId}',
  tags: ['Axe', 'Admin'],
  summary: 'Supprimer une modalité',
  description: `${ADMIN} Supprime une modalité de l’axe. Refusé (409 \`MODALITE_A_DES_ENFANTS\`) si elle a des modalités enfants : les supprimer d’abord.`,
  middleware: [requireAuthentication],
  request: { params: modaliteParamsSchema },
  responses: {
    204: { description: 'Modalité supprimée' },
    403: erreur403,
    404: erreur404,
    409: erreur409,
  },
})

// --- Erreurs métier ------------------------------------------------------------

const describeUpsertAxeError = (
  error: UpsertAxeError,
): { message: string; details: Record<string, unknown> } => {
  switch (error.type) {
    case 'NIVEAU_PORTE_MODALITES':
      return {
        message: `Ces niveaux portent des modalités et ne peuvent pas être supprimés : ${error.ordres.join(', ')}.`,
        details: { ordres: error.ordres },
      }
    case 'AXE_UTILISE':
      return {
        message: `Cet axe est déclaré par des indicateurs (${error.indicateurs.join(', ')}) : on ne peut plus ajouter ni retirer de niveau. Le renommage reste possible.`,
        details: { indicateurs: error.indicateurs },
      }
  }
}

const describeUpsertModaliteError = (
  error: UpsertModaliteError,
): { status: 400 | 409; message: string; details?: Record<string, unknown> } => {
  switch (error.type) {
    case 'MODALITE_AUTRE_AXE':
      return {
        status: 409,
        message: `Cet identifiant est déjà celui d’une modalité de l’axe ${error.axe}.`,
        details: { axe: error.axe },
      }
    case 'CHANGEMENT_PARENT_INTERDIT':
      return {
        status: 409,
        message:
          'Le parent d’une modalité ne peut pas changer. Pour la déplacer, la supprimer puis la recréer.',
        details: { parentActuel: error.parentActuel },
      }
    case 'PARENT_INCONNU':
      return { status: 400, message: 'La modalité parente n’existe pas.' }
    case 'PARENT_AUTRE_AXE':
      return {
        status: 400,
        message: `La modalité parente appartient à un autre axe (${error.axe}).`,
        details: { axe: error.axe },
      }
    case 'NIVEAU_INEXISTANT':
      return {
        status: 400,
        message: `L’axe n’a pas de niveau ${error.ordre} : la modalité parente est au dernier niveau.`,
        details: { ordre: error.ordre },
      }
  }
}

// --- App registration ----------------------------------------------------------

export const axeRoutes = createOpenApiHono()

axeRoutes.openapi(listAxesRoute, async (context) =>
  listAxes(context.req.valid('query')).match(
    (data) => jsonResponseOk({ context, data, schema: AxeListApiModelSchema, status: 200 }),
    never,
  ),
)

axeRoutes.openapi(getAxeRoute, async (context) =>
  getAxeByPublicId({ publicId: context.req.valid('param').id }).match(
    (data) => jsonResponseOk({ context, data, schema: AxeApiModelSchema, status: 200 }),
    never,
  ),
)

axeRoutes.openapi(upsertAxeRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  return (
    await withTransaction(async () =>
      upsertAxe({ publicId: id, body }).andThen(() => getAxeByPublicId({ publicId: id })),
    )
  ).match(
    (data) => jsonResponseOk({ context, data, schema: AxeApiModelSchema, status: 200 }),
    (error) =>
      jsonResponseError({
        context,
        error: { code: error.type, ...describeUpsertAxeError(error) },
        schema: ErrorApiModelSchema,
        status: 409,
      }),
  )
})

axeRoutes.openapi(listModalitesRoute, async (context) =>
  listModalitesForAxe({ axePublicId: context.req.valid('param').id }).match(
    (data) => jsonResponseOk({ context, data, schema: ModaliteListApiModelSchema, status: 200 }),
    never,
  ),
)

axeRoutes.openapi(upsertModaliteRoute, async (context) => {
  const { id, modaliteId } = context.req.valid('param')
  const body = context.req.valid('json')

  return (
    await withTransaction(async () =>
      upsertModalite({ axePublicId: id, publicId: modaliteId, body }).andThen(() =>
        getModaliteByPublicId({ publicId: modaliteId }),
      ),
    )
  ).match(
    (data) => jsonResponseOk({ context, data, schema: ModaliteApiModelSchema, status: 200 }),
    (error) => {
      const { status, message, details } = describeUpsertModaliteError(error)
      return jsonResponseError({
        context,
        error: { code: error.type, message, details },
        schema: ErrorApiModelSchema,
        status,
      })
    },
  )
})

axeRoutes.openapi(deleteModaliteRoute, async (context) => {
  const { id, modaliteId } = context.req.valid('param')

  return (
    await withTransaction(async () => deleteModalite({ axePublicId: id, publicId: modaliteId }))
  ).match(
    () => context.body(null, 204),
    (error) =>
      jsonResponseError({
        context,
        error: {
          code: error.type,
          message: `Cette modalité a des enfants : les supprimer d’abord (${error.enfants.join(', ')}).`,
          details: { enfants: error.enfants },
        },
        schema: ErrorApiModelSchema,
        status: 409,
      }),
  )
})
