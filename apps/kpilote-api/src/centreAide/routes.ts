import { createRoute, z } from '@hono/zod-openapi'
import {
  articleCentreAideApiModelSchema,
  articleCentreAideListApiModelSchema,
  articleCentreAidePublicListApiModelSchema,
  creerArticleCentreAideBodySchema,
  modifierArticleBodySchema,
} from '@pilote/kpilote-shared/centreAide'

import { creerArticleCentreAide } from '@/centreAide/commands/creerArticle'
import { modifierArticleCentreAide } from '@/centreAide/commands/modifierArticle'
import { supprimerArticleCentreAide } from '@/centreAide/commands/supprimerArticle'
import { getArticleCentreAideById } from '@/centreAide/queries/getArticleById'
import { listerArticlesCentreAide } from '@/centreAide/queries/listerArticles'
import { listerArticlesCentreAideCorbeille } from '@/centreAide/queries/listerArticlesCorbeille'
import { listerArticlesCentreAidePublies } from '@/centreAide/queries/listerArticlesPublies'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import {
  erreur400,
  erreur403,
  erreur404,
  erreur409,
  succes200,
} from '@/framework/openapi/responses'
import { withTransaction } from '@/framework/persistence/withTransaction'

const ArticleApiModelSchema = articleCentreAideApiModelSchema.openapi('ArticleCentreAideApiModel')
const ArticleListApiModelSchema = articleCentreAideListApiModelSchema.openapi(
  'ArticleCentreAideListApiModel',
)
const ArticlePublicListApiModelSchema = articleCentreAidePublicListApiModelSchema.openapi(
  'ArticleCentreAidePublicListApiModel',
)
const CreerArticleBodySchema = creerArticleCentreAideBodySchema.openapi(
  'CreerArticleCentreAideBody',
)
const ModifierBodySchema = modifierArticleBodySchema.openapi('ModifierArticleBody')

const detailParamsSchema = z.object({
  id: z.string().uuid().openapi({ description: "Identifiant (UUID) de l'article." }),
})

export const centreAideRoutes = createOpenApiHono()

// --- GET /centre-aide/public -------------------------------------------------

const listerPubliesRoute = createRoute({
  method: 'get',
  path: '/centre-aide/public',
  tags: ['CentreAide'],
  summary: "Lister les articles publiés du centre d'aide",
  description:
    "Réservé aux principaux authentifiés. Retourne l'arborescence publiée et non masquée, champs publiés uniquement (jamais les brouillons).",
  middleware: [requireAuthentication],
  responses: {
    200: succes200('Articles publiés', ArticlePublicListApiModelSchema),
  },
})

// --- GET /centre-aide/articles -----------------------------------------------

const listerRoute = createRoute({
  method: 'get',
  path: '/centre-aide/articles',
  tags: ['CentreAide', 'Admin'],
  summary: "Lister tous les articles du centre d'aide (brouillons inclus)",
  description: 'Réservé aux clés API de rôle `ADMIN`. Retourne l’arborescence complète, à plat.',
  middleware: [requireAuthentication],
  responses: {
    200: succes200('Arborescence complète', ArticleListApiModelSchema),
    403: erreur403,
  },
})

// --- GET /centre-aide/articles/{id} ------------------------------------------

const getByIdRoute = createRoute({
  method: 'get',
  path: '/centre-aide/articles/{id}',
  tags: ['CentreAide', 'Admin'],
  summary: 'Récupérer un article',
  description: 'Réservé aux clés API de rôle `ADMIN`.',
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: succes200('Article trouvé', ArticleApiModelSchema),
    403: erreur403,
    404: erreur404,
  },
})

// --- POST /centre-aide/articles ----------------------------------------------

const creerRoute = createRoute({
  method: 'post',
  path: '/centre-aide/articles',
  tags: ['CentreAide', 'Admin'],
  summary: 'Créer un groupe ou une page',
  description: 'Réservé aux clés API de rôle `ADMIN`. Le noeud est créé en brouillon, non publié.',
  middleware: [requireAuthentication],
  request: {
    body: { content: { 'application/json': { schema: CreerArticleBodySchema } }, required: true },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: ArticleApiModelSchema } },
      description: 'Créé',
    },
    403: erreur403,
  },
})

// --- PUT /centre-aide/articles/{id} ------------------------------------------

const modifierRoute = createRoute({
  method: 'put',
  path: '/centre-aide/articles/{id}',
  tags: ['CentreAide', 'Admin'],
  summary: 'Remplacer l’état éditable d’un article',
  description:
    'Réservé aux clés API de rôle `ADMIN`. Remplacement complet et idempotent : brouillon, ' +
    'champs publiés (le serveur dérive le texte de recherche), position (réindexée), ' +
    'visibilité, publication et cycle de vie.',
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    body: { content: { 'application/json': { schema: ModifierBodySchema } }, required: true },
  },
  responses: {
    200: succes200('Article mis à jour', ArticleApiModelSchema),
    400: erreur400,
    403: erreur403,
    404: erreur404,
  },
})

// --- GET /centre-aide/articles/corbeille -------------------------------------

const corbeilleRoute = createRoute({
  method: 'get',
  path: '/centre-aide/articles/corbeille',
  tags: ['CentreAide', 'Admin'],
  summary: 'Lister les articles en corbeille',
  description: 'Réservé aux clés API de rôle `ADMIN`.',
  middleware: [requireAuthentication],
  responses: {
    200: succes200('Articles en corbeille', ArticleListApiModelSchema),
    403: erreur403,
  },
})

const supprimerRoute = createRoute({
  method: 'delete',
  path: '/centre-aide/articles/{id}',
  tags: ['CentreAide', 'Admin'],
  summary: 'Supprimer définitivement un article et ses descendants',
  description:
    'Réservé aux clés API de rôle `ADMIN`. Effacement irréversible ; l’article doit d’abord être en corbeille (sinon 409).',
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    204: { description: 'Article supprimé' },
    403: erreur403,
    404: erreur404,
    409: erreur409,
  },
})

centreAideRoutes.openapi(listerPubliesRoute, async (context) =>
  listerArticlesCentreAidePublies().match(
    (data) =>
      jsonResponseOk({ context, data, schema: ArticlePublicListApiModelSchema, status: 200 }),
    never,
  ),
)

centreAideRoutes.openapi(listerRoute, async (context) =>
  listerArticlesCentreAide().match(
    (data) => jsonResponseOk({ context, data, schema: ArticleListApiModelSchema, status: 200 }),
    never,
  ),
)

centreAideRoutes.openapi(corbeilleRoute, async (context) =>
  listerArticlesCentreAideCorbeille().match(
    (data) => jsonResponseOk({ context, data, schema: ArticleListApiModelSchema, status: 200 }),
    never,
  ),
)

centreAideRoutes.openapi(getByIdRoute, async (context) => {
  const { id } = context.req.valid('param')
  return getArticleCentreAideById(id).match(
    (data) => jsonResponseOk({ context, data, schema: ArticleApiModelSchema, status: 200 }),
    never,
  )
})

centreAideRoutes.openapi(creerRoute, async (context) => {
  const body = context.req.valid('json')
  return (await withTransaction(async () => creerArticleCentreAide(body))).match(
    (data) => jsonResponseOk({ context, data, schema: ArticleApiModelSchema, status: 201 }),
    never,
  )
})

centreAideRoutes.openapi(modifierRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  return (await withTransaction(async () => modifierArticleCentreAide(id, body))).match(
    (data) => jsonResponseOk({ context, data, schema: ArticleApiModelSchema, status: 200 }),
    never,
  )
})

centreAideRoutes.openapi(supprimerRoute, async (context) => {
  const { id } = context.req.valid('param')
  return (await withTransaction(async () => supprimerArticleCentreAide(id))).match(
    () => context.body(null, 204),
    never,
  )
})
