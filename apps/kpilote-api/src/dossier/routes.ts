import { createRoute, z } from '@hono/zod-openapi'
import {
  creerDossierCommentaireBodySchema,
  listerDossierCommentairesQuerySchema,
  recupererDossierBrouillonQuerySchema,
} from '@pilote/kpilote-shared/commentaire'
import { listerNiveauxConfianceQuerySchema } from '@pilote/kpilote-shared/niveauConfiance'
import {
  dossierApiModelSchema,
  dossierListApiModelSchema,
  listDossiersQuerySchema,
} from '@pilote/kpilote-shared/dossier'
import {
  dossierTauxProgressionApiModelSchema,
  getDossierTauxProgressionQuerySchema,
} from '@pilote/kpilote-shared/dossierTauxProgression'
import { dossierPublicIdSchema } from '@pilote/kpilote-shared/publicIds'

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
import { erreur400, erreur404 } from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'
import { creerDossierCommentaire, dossierConfig } from '@/dossier/commands/creerDossierCommentaire'
import { getDossierByPublicId } from '@/dossier/queries/getDossierByPublicId'
import { getDossierTauxProgression } from '@/dossier/queries/getDossierTauxProgression'
import { listDossiers } from '@/dossier/queries/listDossiers'
import { listerDossierCommentaires } from '@/dossier/queries/listerDossierCommentaires'

const DossierApiModelSchema = dossierApiModelSchema.openapi('DossierApiModel')
const DossierListApiModelSchema = dossierListApiModelSchema.openapi('DossierListApiModel')
const DossierTauxProgressionApiModelSchema = dossierTauxProgressionApiModelSchema.openapi(
  'DossierTauxProgressionApiModel',
)

// --- GET /dossiers ------------------------------------------------------------

const getDossiersRoute = createRoute({
  method: 'get',
  path: '/dossiers',
  tags: ['Dossier'],
  summary: "Lister les dossiers d'indicateurs",
  description:
    "Chaque item inclut `indicateurIds`, triés par ordre d'insertion dans le dossier (createdAt ASC de la jonction).",
  middleware: [requireAuthentication],
  request: { query: listDossiersQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: DossierListApiModelSchema } },
      description: 'Liste paginée des dossiers',
    },
  },
})

// --- GET /dossiers/:id --------------------------------------------------------

const detailParamsSchema = z.object({
  id: dossierPublicIdSchema,
})

const getDossierByIdRoute = createRoute({
  method: 'get',
  path: '/dossiers/{id}',
  tags: ['Dossier'],
  summary: 'Récupérer un dossier par identifiant public',
  description:
    "La réponse inclut `indicateurIds` triés par ordre d'insertion (createdAt ASC de la jonction).",
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: DossierApiModelSchema } },
      description: 'Dossier trouvé',
    },
  },
})

// --- GET /dossiers/:id/taux-progression ---------------------------------------

const getDossierTauxProgressionRoute = createRoute({
  method: 'get',
  path: '/dossiers/{id}/taux-progression',
  tags: ['Dossier'],
  summary: "Récupérer le taux de progression agrégé d'un dossier pour un individu",
  description:
    'Retourne la moyenne pondérée du dernier taux de progression connu de chaque indicateur ' +
    "du dossier pour l'individu demandé. La pondération est lue sur la jonction " +
    '`dossier_indicateur.ponderation` (par défaut 1). Règle tout-ou-rien : si au moins un indicateur du dossier ' +
    "n'a pas de dernier taux calculable (aucun objectif, aucune valeur, ou dernier point avec " +
    '`valeurCible = 0`), le champ `tauxProgression` global vaut `null`. Le tableau ' +
    "`contributions` est toujours renseigné, ce qui permet au client d'identifier les " +
    'indicateurs bloquants. Granularité de troncature fixée à `month` (cf. ' +
    '`docs/architecture/taux-progression.md`). Le taux est tronqué à 2 décimales (ROUND_DOWN) ' +
    'pour préserver la sémantique « ne jamais afficher 100 % avant atteinte stricte ». ' +
    "Renvoie 404 (`ENTITY_NOT_FOUND`) si le dossier ou l'individu est introuvable.",
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    query: getDossierTauxProgressionQuerySchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: DossierTauxProgressionApiModelSchema } },
      description: "Taux de progression du dossier pour l'individu demandé",
    },
    400: erreur400,
    404: erreur404,
  },
})

// --- App registration --------------------------------------------------------

export const dossierRoutes = createOpenApiHono()

dossierRoutes.openapi(getDossiersRoute, async (context) => {
  const { recherche, rechercheIdentifiant, cursor, pageSize } = context.req.valid('query')

  return listDossiers({ recherche, rechercheIdentifiant, cursor, pageSize }).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: DossierListApiModelSchema,
        status: 200,
      }),
    never,
  )
})

dossierRoutes.openapi(getDossierByIdRoute, async (context) => {
  const { id } = context.req.valid('param')

  return getDossierByPublicId(id).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: DossierApiModelSchema,
        status: 200,
      }),
    never,
  )
})

dossierRoutes.openapi(getDossierTauxProgressionRoute, async (context) => {
  const { id } = context.req.valid('param')
  const query = context.req.valid('query')

  return getDossierTauxProgression(id, query).match(
    (data) =>
      jsonResponseOk({
        context,
        data,
        schema: DossierTauxProgressionApiModelSchema,
        status: 200,
      }),
    never,
  )
})

// --- POST /dossiers/:id/commentaires ------------------------------------------

const dossierCommentaireParamsSchema = z.object({ dossierId: dossierPublicIdSchema })

const creerDossierCommentaireRoute = createRoute({
  method: 'post',
  path: '/dossiers/{dossierId}/commentaires',
  tags: ['Dossier'],
  summary: 'Créer un commentaire global sur un dossier',
  middleware: [requireAuthentication],
  request: {
    params: dossierCommentaireParamsSchema,
    body: {
      content: { 'application/json': { schema: creerDossierCommentaireBodySchema } },
      required: true,
    },
  },
  responses: reponseCommentaire,
})

dossierRoutes.openapi(creerDossierCommentaireRoute, async (context) => {
  const params = context.req.valid('param')
  const body = context.req.valid('json')
  const result = await withTransaction(async () => creerDossierCommentaire({ params, body }))
  return result.match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /dossiers/:id/commentaires -------------------------------------------

const listerDossierCommentairesRoute = createRoute({
  method: 'get',
  path: '/dossiers/{dossierId}/commentaires',
  tags: ['Dossier'],
  summary: "Lister les commentaires globaux d'un dossier",
  middleware: [requireAuthentication],
  request: {
    params: dossierCommentaireParamsSchema,
    query: listerDossierCommentairesQuerySchema,
  },
  responses: reponseListe,
})

dossierRoutes.openapi(listerDossierCommentairesRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerDossierCommentaires({ params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireListApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /dossiers/:id/commentaires/brouillon ---------------------------------

const getDossierBrouillonRoute = createRoute({
  method: 'get',
  path: '/dossiers/{dossierId}/commentaires/brouillon',
  tags: ['Dossier'],
  summary: 'Récupérer mon brouillon courant (dossier global)',
  middleware: [requireAuthentication],
  request: {
    params: dossierCommentaireParamsSchema,
    query: recupererDossierBrouillonQuerySchema,
  },
  responses: reponseBrouillon,
})

dossierRoutes.openapi(getDossierBrouillonRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return getDernierBrouillon(dossierConfig, { params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: BrouillonApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /dossiers/:id/niveaux-confiance --------------------------------------

const listerNiveauxParCommentairesDossierRoute = createRoute({
  method: 'get',
  path: '/dossiers/{dossierId}/niveaux-confiance',
  tags: ['Dossier', 'NiveauConfiance'],
  summary: 'Niveaux de confiance des commentaires demandés (dossier global)',
  middleware: [requireAuthentication],
  request: {
    params: dossierCommentaireParamsSchema,
    query: listerNiveauxConfianceQuerySchema,
  },
  responses: reponseListeNiveauxConfiance,
})

dossierRoutes.openapi(listerNiveauxParCommentairesDossierRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerNiveauxParCommentaires(dossierConfig, { params, query }).match(
    (data) =>
      jsonResponseOk({ context, data, schema: NiveauConfianceListApiModelSchema, status: 200 }),
    never,
  )
})
