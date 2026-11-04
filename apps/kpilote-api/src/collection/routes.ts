import { createRoute, z } from '@hono/zod-openapi'
import {
  creerCollectionCommentaireBodySchema,
  listerCollectionCommentairesQuerySchema,
  recupererCollectionBrouillonQuerySchema,
} from '@pilote/kpilote-shared/commentaire'
import { listerNiveauxConfianceQuerySchema } from '@pilote/kpilote-shared/niveauConfiance'
import {
  addCollectionIndicateurBodySchema,
  addCollectionResponsableBodySchema,
  collectionApiModelSchema,
  collectionListApiModelSchema,
  createCollectionBodySchema,
  listCollectionsQuerySchema,
  updateCollectionIndicateurPonderationBodySchema,
  upsertCollectionBodySchema,
} from '@pilote/kpilote-shared/collection'
import {
  collectionTauxProgressionApiModelSchema,
  getCollectionTauxProgressionQuerySchema,
} from '@pilote/kpilote-shared/collectionTauxProgression'
import { collectionPermissionsApiModelSchema } from '@pilote/kpilote-shared/permission'
import {
  collectionPublicIdSchema,
  indicateurPublicIdSchema,
} from '@pilote/kpilote-shared/publicIds'

import {
  NiveauConfianceListApiModelSchema,
  reponseListeNiveauxConfiance,
} from '@/niveauConfiance/openapi'
import { listerNiveauxParCommentaires } from '@/niveauConfiance/queries/listerNiveauxParCommentaires'
import {
  BrouillonApiModelSchema,
  CommentaireApiModelSchema,
  CommentaireListApiModelSchema,
  reponseBrouillon,
  reponseCommentaire,
  reponseListe,
} from '@/commentaire/openapi'
import { getDernierBrouillon } from '@/commentaire/queries/getDernierBrouillon'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur400, erreur403, erreur404, erreur409 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { addCollectionIndicateur } from '@/collection/commands/addCollectionIndicateur'
import { addCollectionResponsable } from '@/collection/commands/addCollectionResponsable'
import { createCollection } from '@/collection/commands/createCollection'
import { deleteCollection } from '@/collection/commands/deleteCollection'
import { removeCollectionIndicateur } from '@/collection/commands/removeCollectionIndicateur'
import { removeCollectionResponsable } from '@/collection/commands/removeCollectionResponsable'
import { updateCollectionIndicateurPonderation } from '@/collection/commands/updateCollectionIndicateurPonderation'
import { upsertCollection } from '@/collection/commands/upsertCollection'
import {
  creerCollectionCommentaire,
  collectionConfig,
} from '@/collection/commands/creerCollectionCommentaire'
import { getCollectionByPublicId } from '@/collection/queries/getCollectionByPublicId'
import { getCollectionTauxProgression } from '@/collection/queries/getCollectionTauxProgression'
import { listCollectionPermissions } from '@/collection/queries/listCollectionPermissions'
import { listCollections } from '@/collection/queries/listCollections'
import { listerCollectionCommentaires } from '@/collection/queries/listerCollectionCommentaires'

const CollectionApiModelSchema = collectionApiModelSchema.openapi('CollectionApiModel')
const CollectionListApiModelSchema = collectionListApiModelSchema.openapi('CollectionListApiModel')
const CollectionTauxProgressionApiModelSchema = collectionTauxProgressionApiModelSchema.openapi(
  'CollectionTauxProgressionApiModel',
)
const CreateCollectionBodySchema = createCollectionBodySchema.openapi('CreateCollectionBody')
const UpsertCollectionBodySchema = upsertCollectionBodySchema.openapi('UpsertCollectionBody')
const AddCollectionIndicateurBodySchema = addCollectionIndicateurBodySchema.openapi(
  'AddCollectionIndicateurBody',
)
const UpdateCollectionIndicateurPonderationBodySchema =
  updateCollectionIndicateurPonderationBodySchema.openapi(
    'UpdateCollectionIndicateurPonderationBody',
  )

const AddCollectionResponsableBodySchema = addCollectionResponsableBodySchema.openapi(
  'AddCollectionResponsableBody',
)
const CollectionPermissionsApiModelSchema = collectionPermissionsApiModelSchema.openapi(
  'CollectionPermissionsApiModel',
)

const collectionIndicateurParamsSchema = z.object({
  id: collectionPublicIdSchema,
  indicateurId: indicateurPublicIdSchema,
})

const collectionResponsableParamsSchema = z.object({
  id: collectionPublicIdSchema,
  utilisateurId: z.string().uuid(),
})

// --- GET /collections ------------------------------------------------------------

const getCollectionsRoute = createRoute({
  method: 'get',
  path: '/collections',
  tags: ['Collection'],
  summary: "Lister les collections d'indicateurs",
  description:
    "Chaque item inclut `indicateurs` (identifiant public et pondération), triés par ordre d'insertion dans la collection (createdAt ASC de la jonction).",
  middleware: [requireAuthentication],
  request: { query: listCollectionsQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: CollectionListApiModelSchema } },
      description: 'Liste paginée des collections',
    },
  },
})

// --- GET /collections/:id --------------------------------------------------------

const detailParamsSchema = z.object({
  id: collectionPublicIdSchema,
})

const getCollectionByIdRoute = createRoute({
  method: 'get',
  path: '/collections/{id}',
  tags: ['Collection'],
  summary: 'Récupérer une collection par identifiant public',
  description:
    "La réponse inclut `indicateurs` (identifiant public et pondération), triés par ordre d'insertion (createdAt ASC de la jonction).",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: CollectionApiModelSchema } },
      description: 'Collection trouvé',
    },
  },
})

// --- GET /collections/:id/taux-progression ---------------------------------------

const getCollectionTauxProgressionRoute = createRoute({
  method: 'get',
  path: '/collections/{id}/taux-progression',
  tags: ['Collection'],
  summary: "Récupérer le taux de progression agrégé d'une collection pour un individu",
  description:
    'Retourne la moyenne pondérée du dernier taux de progression connu de chaque indicateur ' +
    "de la collection pour l'individu demandé. La pondération est lue sur la jonction " +
    '`collection_indicateur.ponderation` (par défaut 1). Règle tout-ou-rien : si au moins un indicateur de la collection ' +
    "n'a pas de dernier taux calculable (aucun objectif, aucune valeur, ou dernier point avec " +
    '`valeurCible = 0`), le champ `tauxProgression` global vaut `null`. Le tableau ' +
    "`contributions` est toujours renseigné, ce qui permet au client d'identifier les " +
    'indicateurs bloquants. Granularité de troncature fixée à `month` (cf. ' +
    '`docs/architecture/taux-progression.md`). Le taux est tronqué à 2 décimales (ROUND_DOWN) ' +
    'pour préserver la sémantique « ne jamais afficher 100 % avant atteinte stricte ». ' +
    "Renvoie 404 (`ENTITY_NOT_FOUND`) si la collection ou l'individu est introuvable.",
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    query: getCollectionTauxProgressionQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: CollectionTauxProgressionApiModelSchema } },
      description: "Taux de progression de la collection pour l'individu demandé",
    },
    400: erreur400,
    404: erreur404,
  },
})

// --- App registration --------------------------------------------------------

export const collectionRoutes = createOpenApiHono()

collectionRoutes.openapi(getCollectionsRoute, async (context) => {
  const { recherche, rechercheIdentifiant, cursor, pageSize } = context.req.valid('query')

  return listCollections({ recherche, rechercheIdentifiant, cursor, pageSize }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: CollectionListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

collectionRoutes.openapi(getCollectionByIdRoute, async (context) => {
  const { id } = context.req.valid('param')

  return getCollectionByPublicId(id).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: CollectionApiModelSchema,
        status: 200,
      }),
    never,
  )
})

collectionRoutes.openapi(getCollectionTauxProgressionRoute, async (context) => {
  const { id } = context.req.valid('param')
  const query = context.req.valid('query')

  return getCollectionTauxProgression(id, query).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: CollectionTauxProgressionApiModelSchema,
        status: 200,
      }),
    never,
  )
})

// --- POST /collections -----------------------------------------------------------

const createCollectionRoute = createRoute({
  method: 'post',
  path: '/collections',
  tags: ['Collection', 'Admin'],
  summary: 'Créer une collection',
  description:
    "Réservé aux clés API de rôle `ADMIN`. L'identifiant public est généré par l'API au format `COL-NNN` : il suit le plus grand identifiant numérique existant. Pour imposer un identifiant, utiliser `PUT /collections/{id}`.",
  middleware: [requireAuthentication],
  request: {
    body: {
      content: { 'application/json': { schema: CreateCollectionBodySchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: CollectionApiModelSchema } },
      description: 'Collection créée',
    },
    400: erreur400,
    403: erreur403,
  },
})

collectionRoutes.openapi(createCollectionRoute, async (context) => {
  const body = context.req.valid('json')
  const result = await withTransaction(async () => createCollection(body))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CollectionApiModelSchema, status: 201 }),
    never,
  )
})

// --- PUT /collections/:id --------------------------------------------------------

const upsertCollectionRoute = createRoute({
  method: 'put',
  path: '/collections/{id}',
  tags: ['Collection', 'Admin'],
  summary: 'Créer ou remplacer une collection',
  description:
    "Réservé aux clés API de rôle `ADMIN`. Crée la collection si l'identifiant est libre, remplace sinon `nom`, `description` et `visibilite`. Les indicateurs, responsables et permissions affectés ne sont pas modifiés : ils ont leurs propres routes.",
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    body: {
      content: { 'application/json': { schema: UpsertCollectionBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: CollectionApiModelSchema } },
      description: 'Collection créée ou mise à jour',
    },
    400: erreur400,
    403: erreur403,
  },
})

collectionRoutes.openapi(upsertCollectionRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => upsertCollection(id, body))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CollectionApiModelSchema, status: 200 }),
    never,
  )
})

// --- DELETE /collections/:id -----------------------------------------------------

const deleteCollectionRoute = createRoute({
  method: 'delete',
  path: '/collections/{id}',
  tags: ['Collection', 'Admin'],
  summary: 'Supprimer une collection',
  description:
    "Réservé aux clés API de rôle `ADMIN`. Supprime définitivement la collection ainsi que ses indicateurs affectés, responsables, permissions, contacts utiles et commentaires. Les indicateurs eux-mêmes ne sont pas supprimés. Idempotent : renvoie `204` même si la collection n'existait pas.",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    204: { description: 'Collection supprimée' },
    403: erreur403,
  },
})

collectionRoutes.openapi(deleteCollectionRoute, async (context) => {
  const { id } = context.req.valid('param')
  const result = await withTransaction(async () => deleteCollection(id))
  return result.match(() => context.body(null, 204), never)
})

// --- POST /collections/:id/indicateurs -------------------------------------------

const addCollectionIndicateurRoute = createRoute({
  method: 'post',
  path: '/collections/{id}/indicateurs',
  tags: ['Collection', 'Admin'],
  summary: 'Affecter un indicateur à une collection',
  description:
    "Réservé aux clés API de rôle `ADMIN`. `ponderation` est optionnelle et vaut `1` par défaut. Renvoie `409` si l'indicateur est déjà affecté, `404` si la collection ou l'indicateur est introuvable. La réponse est la collection à jour.",
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    body: {
      content: { 'application/json': { schema: AddCollectionIndicateurBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: CollectionApiModelSchema } },
      description: 'Collection à jour',
    },
    400: erreur400,
    403: erreur403,
    404: erreur404,
    409: erreur409,
  },
})

collectionRoutes.openapi(addCollectionIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => addCollectionIndicateur(id, body))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CollectionApiModelSchema, status: 200 }),
    never,
  )
})

// --- PATCH /collections/:id/indicateurs/:indicateurId ----------------------------

const updateCollectionIndicateurPonderationRoute = createRoute({
  method: 'patch',
  path: '/collections/{id}/indicateurs/{indicateurId}',
  tags: ['Collection', 'Admin'],
  summary: "Modifier la pondération d'un indicateur dans une collection",
  description:
    "Réservé aux clés API de rôle `ADMIN`. La pondération règle le poids de l'indicateur dans la moyenne pondérée renvoyée par `GET /collections/{id}/taux-progression` : la modification y est immédiatement prise en compte. Une pondération de `0` exclut l'indicateur du calcul. Renvoie `404` si l'indicateur n'est pas affecté à la collection.",
  middleware: [requireAuthentication],
  request: {
    params: collectionIndicateurParamsSchema,
    body: {
      content: { 'application/json': { schema: UpdateCollectionIndicateurPonderationBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: CollectionApiModelSchema } },
      description: 'Collection à jour',
    },
    400: erreur400,
    403: erreur403,
    404: erreur404,
  },
})

collectionRoutes.openapi(updateCollectionIndicateurPonderationRoute, async (context) => {
  const { id, indicateurId } = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () =>
    updateCollectionIndicateurPonderation(id, indicateurId, body),
  )
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CollectionApiModelSchema, status: 200 }),
    never,
  )
})

// --- DELETE /collections/:id/indicateurs/:indicateurId ---------------------------

const removeCollectionIndicateurRoute = createRoute({
  method: 'delete',
  path: '/collections/{id}/indicateurs/{indicateurId}',
  tags: ['Collection', 'Admin'],
  summary: "Retirer un indicateur d'une collection",
  description:
    "Réservé aux clés API de rôle `ADMIN`. Retire uniquement l'affectation : l'indicateur n'est pas supprimé. Idempotent, renvoie `204` même si l'indicateur n'était pas affecté.",
  middleware: [requireAuthentication],
  request: { params: collectionIndicateurParamsSchema },
  responses: {
    204: { description: 'Indicateur retiré de la collection' },
    403: erreur403,
  },
})

collectionRoutes.openapi(removeCollectionIndicateurRoute, async (context) => {
  const { id, indicateurId } = context.req.valid('param')
  const result = await withTransaction(async () => removeCollectionIndicateur(id, indicateurId))
  return result.match(() => context.body(null, 204), never)
})

// --- POST /collections/:id/responsables ------------------------------------------

const addCollectionResponsableRoute = createRoute({
  method: 'post',
  path: '/collections/{id}/responsables',
  tags: ['Collection', 'Admin'],
  summary: 'Désigner un responsable de collection',
  description:
    "Réservé aux clés API de rôle `ADMIN`. Désignation métier : elle n'accorde aucun droit d'accès, qui relève de `POST /permissions/collection`. Renvoie `409` si l'utilisateur est déjà responsable, `404` si la collection ou l'utilisateur est introuvable.",
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    body: {
      content: { 'application/json': { schema: AddCollectionResponsableBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: CollectionApiModelSchema } },
      description: 'Collection à jour',
    },
    400: erreur400,
    403: erreur403,
    404: erreur404,
    409: erreur409,
  },
})

collectionRoutes.openapi(addCollectionResponsableRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => addCollectionResponsable(id, body))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CollectionApiModelSchema, status: 200 }),
    never,
  )
})

// --- DELETE /collections/:id/responsables/:utilisateurId -------------------------

const removeCollectionResponsableRoute = createRoute({
  method: 'delete',
  path: '/collections/{id}/responsables/{utilisateurId}',
  tags: ['Collection', 'Admin'],
  summary: "Retirer un responsable d'une collection",
  description:
    "Réservé aux clés API de rôle `ADMIN`. Retire uniquement la désignation : l'utilisateur n'est pas supprimé et ses permissions ne sont pas modifiées. Idempotent, renvoie `204` même si l'utilisateur n'était pas responsable.",
  middleware: [requireAuthentication],
  request: { params: collectionResponsableParamsSchema },
  responses: {
    204: { description: 'Responsable retiré de la collection' },
    403: erreur403,
  },
})

collectionRoutes.openapi(removeCollectionResponsableRoute, async (context) => {
  const { id, utilisateurId } = context.req.valid('param')
  const result = await withTransaction(async () => removeCollectionResponsable(id, utilisateurId))
  return result.match(() => context.body(null, 204), never)
})

// --- GET /collections/:id/permissions --------------------------------------------

const listCollectionPermissionsRoute = createRoute({
  method: 'get',
  path: '/collections/{id}/permissions',
  tags: ['Collection', 'Permission', 'Admin'],
  summary: 'Lister les principals ayant accès à une collection',
  description:
    "Lecture inverse de `GET /permissions?principalId=…`, qui ne répond qu'à « à quoi ce principal a-t-il accès ». Retourne les principals (utilisateurs et clés API) disposant d'une permission directe sur la collection, triés par `type` puis `libelle`. L'octroi et le retrait passent par `POST` / `DELETE /permissions/collection`.",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: CollectionPermissionsApiModelSchema } },
      description: 'Principals disposant d’une permission directe',
    },
    400: erreur400,
    403: erreur403,
  },
})

collectionRoutes.openapi(listCollectionPermissionsRoute, async (context) => {
  const { id } = context.req.valid('param')
  return listCollectionPermissions(id).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: CollectionPermissionsApiModelSchema,
        status: 200,
      }),
    never,
  )
})

// --- POST /collections/:id/commentaires ------------------------------------------

const collectionCommentaireParamsSchema = z.object({ collectionId: collectionPublicIdSchema })

const creerCollectionCommentaireRoute = createRoute({
  method: 'post',
  path: '/collections/{collectionId}/commentaires',
  tags: ['Collection'],
  summary: 'Créer un commentaire global sur une collection',
  middleware: [requireAuthentication],
  request: {
    params: collectionCommentaireParamsSchema,
    body: {
      content: { 'application/json': { schema: creerCollectionCommentaireBodySchema } },
      required: true,
    },
  },
  responses: reponseCommentaire,
})

collectionRoutes.openapi(creerCollectionCommentaireRoute, async (context) => {
  const params = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => creerCollectionCommentaire({ params, body }))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /collections/:id/commentaires -------------------------------------------

const listerCollectionCommentairesRoute = createRoute({
  method: 'get',
  path: '/collections/{collectionId}/commentaires',
  tags: ['Collection'],
  summary: "Lister les commentaires globaux d'une collection",
  middleware: [requireAuthentication],
  request: {
    params: collectionCommentaireParamsSchema,
    query: listerCollectionCommentairesQuerySchema,
  },
  responses: reponseListe,
})

collectionRoutes.openapi(listerCollectionCommentairesRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerCollectionCommentaires({ params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireListApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /collections/:id/commentaires/brouillon ---------------------------------

const getCollectionBrouillonRoute = createRoute({
  method: 'get',
  path: '/collections/{collectionId}/commentaires/brouillon',
  tags: ['Collection'],
  summary: 'Récupérer mon brouillon courant (collection global)',
  middleware: [requireAuthentication],
  request: {
    params: collectionCommentaireParamsSchema,
    query: recupererCollectionBrouillonQuerySchema,
  },
  responses: reponseBrouillon,
})

collectionRoutes.openapi(getCollectionBrouillonRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return getDernierBrouillon(collectionConfig, { params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: BrouillonApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /collections/:id/niveaux-confiance --------------------------------------

const listerNiveauxParCommentairesCollectionRoute = createRoute({
  method: 'get',
  path: '/collections/{collectionId}/niveaux-confiance',
  tags: ['Collection', 'NiveauConfiance'],
  summary: 'Niveaux de confiance des commentaires demandés (collection global)',
  middleware: [requireAuthentication],
  request: {
    params: collectionCommentaireParamsSchema,
    query: listerNiveauxConfianceQuerySchema,
  },
  responses: reponseListeNiveauxConfiance,
})

collectionRoutes.openapi(listerNiveauxParCommentairesCollectionRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerNiveauxParCommentaires(collectionConfig, { params, query }).match(
    (data) =>
      jsonResponseOk({ context, data, schema: NiveauConfianceListApiModelSchema, status: 200 }),
    never,
  )
})
