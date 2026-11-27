import { createRoute, z } from '@hono/zod-openapi'
import {
  creerIndicateurIndividuCommentaireBodySchema,
  listerIndicateurIndividuCommentairesQuerySchema,
  recupererIndicateurIndividuBrouillonQuerySchema,
} from '@pilote/kpilote-shared/commentaire'
import {
  indicateurApiModelSchema,
  listIndicateursQuerySchema,
  upsertIndicateurBodySchema,
} from '@pilote/kpilote-shared/indicateur'
import { listerNiveauxConfianceQuerySchema } from '@pilote/kpilote-shared/niveauConfiance'
import { createPaginatedApiListSchema } from '@pilote/kpilote-shared/pagination'
import { indicateurPublicIdSchema, individuPublicIdSchema } from '@pilote/kpilote-shared/publicIds'

import {
  BrouillonApiModelSchema,
  CommentaireApiModelSchema,
  CommentaireListApiModelSchema,
  describeCreerCommentaireError,
  reponseBrouillon,
  reponseCreationCommentaire,
  reponseListe,
} from '@/commentaire/openapi'
import { getDernierBrouillon } from '@/commentaire/queries/getDernierBrouillon'
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
import { pinIndicateur, type PinIndicateurError } from '@/indicateur/commands/pinIndicateur'
import { unpinIndicateur } from '@/indicateur/commands/unpinIndicateur'
import {
  upsertIndicateur,
  type UpsertIndicateurError,
} from '@/indicateur/commands/upsertIndicateur'
import {
  creerIndicateurIndividuCommentaire,
  indicateurIndividuConfig,
} from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'
import { listIndicateurs } from '@/indicateur/queries/listIndicateurs'
import { listerIndicateurIndividuCommentaires } from '@/indicateur/queries/listerIndicateurIndividuCommentaires'
import {
  NiveauConfianceListApiModelSchema,
  reponseListeNiveauxConfiance,
} from '@/niveauConfiance/openapi'
import { listerNiveauxParCommentaires } from '@/niveauConfiance/queries/listerNiveauxParCommentaires'

const IndicateurApiModelSchema = indicateurApiModelSchema.openapi('IndicateurApiModel')
const IndicateurListApiModelSchema =
  createPaginatedApiListSchema(indicateurApiModelSchema).openapi('IndicateurListApiModel')
const UpsertIndicateurBodySchema = upsertIndicateurBodySchema.openapi('UpsertIndicateurBody')

// --- GET /indicateurs --------------------------------------------------------

const getIndicateursRoute = createRoute({
  method: 'get',
  path: '/indicateurs',
  tags: ['Indicateur'],
  summary: 'Lister les indicateurs',
  description:
    "Retourne la liste paginée des indicateurs avec un filtre de recherche par nom. La pagination est cursor-based : passez `cursor` (renvoyé dans la réponse précédente) pour obtenir la page suivante. `hasMore` indique s'il reste des pages. Chaque item inclut `referentielIds` (triés par identifiant public ASC). Avec `individus`, les indicateurs liés au référentiel d'un individu sélectionné passent en tête de liste.",
  middleware: [requireAuthentication],
  request: { query: listIndicateursQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurListApiModelSchema } },
      description: 'Liste paginée des indicateurs',
    },
    400: erreur400,
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
    'Retourne un indicateur identifié par son identifiant public (format `IND-XXX`). La réponse inclut `referentielIds` (référentiels liés, triés par publicId ASC). Renvoie 404 (`ENTITY_NOT_FOUND`) si aucun indicateur ne correspond.',
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IndicateurApiModelSchema } },
      description: 'Indicateur trouvé',
    },
    404: erreur404,
  },
})

// --- PUT /indicateurs/:id ----------------------------------------------------

const upsertIndicateurRoute = createRoute({
  method: 'put',
  path: '/indicateurs/{id}',
  tags: ['Indicateur', 'Admin'],
  summary: 'Créer ou remplacer un indicateur',
  description:
    "Réservé aux clés API de rôle `ADMIN` (les utilisateurs OIDC authentifiés restent autorisés). Crée l'indicateur s'il n'existe pas, sinon le met à jour. " +
    '`nom`, `visibilite`, `unite` et `sensSouhaite` sont obligatoires et remplacés à chaque appel. ' +
    "`referentiels` est obligatoire et applique une sémantique replace-all : l'ensemble des configurations devient strictement celui décrit dans le body (tableau vide pour aucun référentiel), les doublons sont dédupliqués. " +
    'Les métadonnées (`description`, `methodeCalcul`, `sourceDonnees`, `sourceUrl`, `periodeMiseAJour`, `jourMiseAJour`, `delaiMiseADisposition`) sont optionnelles : absentes, elles restent inchangées ; à `null`, elles sont effacées. ' +
    '`responsables` est optionnel : absent, la liste reste inchangée ; présent, elle est remplacée. ' +
    "Le champ `axes` est optionnel (absent = inchangé, `[]` = aucun axe) et remplace la déclaration complète ; la position donne l'ordre de déclaration. Axe inconnu : 400 `AXES_INCONNUS` avec `details.unknownAxeIds`. Ajouter ou retirer un axe sur un indicateur qui a déjà des valeurs : 409 `AXES_VERROUILLES` (changer la fonction ou l'ordre reste permis). " +
    "Référentiel inconnu : 400 `REFERENTIELS_INCONNUS` avec `details.unknownReferentielIds`. Responsable inconnu : 400 `UTILISATEURS_INCONNUS` avec `details.unknownUtilisateurIds`. L'opération est atomique (transaction unique).",
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
    400: erreur400,
    403: erreur403,
    409: erreur409,
  },
})

// --- Erreurs métier ------------------------------------------------------------

const describeUpsertIndicateurError = (
  error: UpsertIndicateurError,
): { status: 400 | 409; message: string; details?: Record<string, unknown> } => {
  switch (error.type) {
    case 'REFERENTIELS_INCONNUS':
      return {
        status: 400,
        message: 'Référentiels inconnus',
        details: { unknownReferentielIds: error.referentiels },
      }
    case 'UTILISATEURS_INCONNUS':
      return {
        status: 400,
        message: 'Utilisateurs inconnus',
        details: { unknownUtilisateurIds: error.utilisateurs },
      }
    case 'AXES_INCONNUS':
      return { status: 400, message: 'Axes inconnus', details: { unknownAxeIds: error.axes } }
    case 'AXES_VERROUILLES':
      return {
        status: 409,
        message:
          'Cet indicateur a déjà des valeurs : on ne peut plus lui ajouter ni lui retirer d’axe. Changer la fonction ou l’ordre des axes reste possible.',
        details: { nombreValeurs: error.nombreValeurs },
      }
  }
}

// --- App registration --------------------------------------------------------

export const indicateurRoutes = createOpenApiHono()

indicateurRoutes.openapi(getIndicateursRoute, async (context) => {
  return listIndicateurs({ query: context.req.valid('query') }).match(
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

  return withTransaction(() => upsertIndicateur(id, body))
    .andThen(() => getIndicateurByPublicId(id))
    .match(
      (data) =>
        jsonResponseOk({
          context,
          data,
          schema: IndicateurApiModelSchema,
          status: 200,
        }),
      (error) => {
        const { status, message, details } = describeUpsertIndicateurError(error)
        return jsonResponseError({
          context,
          error: { code: error.type, message, details },
          schema: ErrorApiModelSchema,
          status,
        })
      },
    )
})

// --- POST /indicateurs/:id/individus/:individuId/commentaires ----------------

const indicateurIndividuCommentaireParamsSchema = z.object({
  indicateurId: indicateurPublicIdSchema,
  individuId: individuPublicIdSchema,
})

const creerIndicateurIndividuCommentaireRoute = createRoute({
  method: 'post',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/commentaires',
  tags: ['Indicateur'],
  summary: 'Créer un commentaire sur un indicateur pour un individu',
  middleware: [requireAuthentication],
  request: {
    params: indicateurIndividuCommentaireParamsSchema,
    body: {
      content: { 'application/json': { schema: creerIndicateurIndividuCommentaireBodySchema } },
      required: true,
    },
  },
  responses: reponseCreationCommentaire,
})

indicateurRoutes.openapi(creerIndicateurIndividuCommentaireRoute, async (context) => {
  const params = context.req.valid('param')
  const body = context.req.valid('json')
  return withTransaction(() => creerIndicateurIndividuCommentaire({ params, body })).match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireApiModelSchema, status: 200 }),
    (error) => {
      const { status, message, details } = describeCreerCommentaireError(error)
      return jsonResponseError({
        context,
        error: { code: error.type, message, details },
        schema: ErrorApiModelSchema,
        status,
      })
    },
  )
})

// --- GET /indicateurs/:id/individus/:individuId/commentaires -----------------

const listerIndicateurIndividuCommentairesRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/commentaires',
  tags: ['Indicateur'],
  summary: 'Lister les commentaires d’un indicateur pour un individu',
  middleware: [requireAuthentication],
  request: {
    params: indicateurIndividuCommentaireParamsSchema,
    query: listerIndicateurIndividuCommentairesQuerySchema,
  },
  responses: reponseListe,
})

indicateurRoutes.openapi(listerIndicateurIndividuCommentairesRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerIndicateurIndividuCommentaires({ params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: CommentaireListApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /indicateurs/:id/individus/:individuId/commentaires/brouillon -------

const getIndicateurIndividuBrouillonRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/commentaires/brouillon',
  tags: ['Indicateur'],
  summary: 'Récupérer mon brouillon courant (indicateur + individu)',
  middleware: [requireAuthentication],
  request: {
    params: indicateurIndividuCommentaireParamsSchema,
    query: recupererIndicateurIndividuBrouillonQuerySchema,
  },
  responses: reponseBrouillon,
})

indicateurRoutes.openapi(getIndicateurIndividuBrouillonRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return getDernierBrouillon(indicateurIndividuConfig, { params, query }).match(
    (data) => jsonResponseOk({ context, data, schema: BrouillonApiModelSchema, status: 200 }),
    never,
  )
})

// --- GET /indicateurs/:id/individus/:individuId/niveaux-confiance ------------

const listerNiveauxParCommentairesIndicateurIndividuRoute = createRoute({
  method: 'get',
  path: '/indicateurs/{indicateurId}/individus/{individuId}/niveaux-confiance',
  tags: ['Indicateur', 'NiveauConfiance'],
  summary: 'Niveaux de confiance des commentaires demandés (indicateur + individu)',
  middleware: [requireAuthentication],
  request: {
    params: indicateurIndividuCommentaireParamsSchema,
    query: listerNiveauxConfianceQuerySchema,
  },
  responses: reponseListeNiveauxConfiance,
})

indicateurRoutes.openapi(listerNiveauxParCommentairesIndicateurIndividuRoute, async (context) => {
  const params = context.req.valid('param')
  const query = context.req.valid('query')
  return listerNiveauxParCommentaires(indicateurIndividuConfig, { params, query }).match(
    (data) =>
      jsonResponseOk({ context, data, schema: NiveauConfianceListApiModelSchema, status: 200 }),
    never,
  )
})

// --- PUT /indicateurs/:id/epingle --------------------------------------------

const pinIndicateurRoute = createRoute({
  method: 'put',
  path: '/indicateurs/{id}/epingle',
  tags: ['Indicateur'],
  summary: 'Épingler un indicateur',
  description:
    'Épingle l’indicateur pour l’utilisateur courant ; recommencer ne change rien. Un utilisateur ' +
    'épingle au plus 20 indicateurs qu’il peut lire : au-delà, la requête répond 409 ' +
    '(`LIMITE_EPINGLES_ATTEINTE`). Réservé aux utilisateurs : une clé API n’a pas d’épingle.',
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    204: { description: 'Indicateur épinglé' },
    403: erreur403,
    404: erreur404,
    409: erreur409,
  },
})

const describePinIndicateurError = (
  error: PinIndicateurError,
): { status: 409; message: string; details?: Record<string, unknown> } => {
  switch (error.type) {
    case 'LIMITE_EPINGLES_ATTEINTE':
      return {
        status: 409,
        message: `Vous avez déjà épinglé ${error.limite} indicateurs. Désépinglez-en un pour en épingler un autre.`,
        details: { limite: error.limite },
      }
  }
}

indicateurRoutes.openapi(pinIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  return withTransaction(() => pinIndicateur({ publicId: id })).match(
    () => context.body(null, 204),
    (error) => {
      const { status, message, details } = describePinIndicateurError(error)
      return jsonResponseError({
        context,
        error: { code: error.type, message, details },
        schema: ErrorApiModelSchema,
        status,
      })
    },
  )
})

// --- DELETE /indicateurs/:id/epingle -----------------------------------------

const unpinIndicateurRoute = createRoute({
  method: 'delete',
  path: '/indicateurs/{id}/epingle',
  tags: ['Indicateur'],
  summary: 'Désépingler un indicateur',
  description:
    'Retire l’épingle de l’utilisateur courant. Un indicateur inconnu ou non épinglé ne change ' +
    'rien. Réservé aux utilisateurs : une clé API n’a pas d’épingle.',
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    204: { description: 'Indicateur désépinglé' },
    403: erreur403,
  },
})

indicateurRoutes.openapi(unpinIndicateurRoute, async (context) => {
  const { id } = context.req.valid('param')
  return withTransaction(() => unpinIndicateur({ publicId: id })).match(
    () => context.body(null, 204),
    never,
  )
})
