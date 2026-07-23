import { createRoute, z } from '@hono/zod-openapi'
import {
  articleCentreAideApiModelSchema,
  articleCentreAideListApiModelSchema,
  articleCentreAidePublicListApiModelSchema,
  basculerVisibiliteArticleBodySchema,
  creerArticleCentreAideBodySchema,
  deplacerArticleBodySchema,
  modifierBrouillonArticleBodySchema,
} from '@pilote/kpilote-shared/centreAide'

import { basculerVisibiliteArticleCentreAide } from '@/centreAide/commands/basculerVisibiliteArticle'
import { creerArticleCentreAide } from '@/centreAide/commands/creerArticle'
import { deplacerArticleCentreAide } from '@/centreAide/commands/deplacerArticle'
import { depublierArticleCentreAide } from '@/centreAide/commands/depublierArticle'
import { modifierBrouillonArticleCentreAide } from '@/centreAide/commands/modifierBrouillonArticle'
import { publierArticleCentreAide } from '@/centreAide/commands/publierArticle'
import { supprimerArticleCentreAide } from '@/centreAide/commands/supprimerArticle'
import { getArticleCentreAideById } from '@/centreAide/queries/getArticleById'
import { listerArticlesCentreAide } from '@/centreAide/queries/listerArticles'
import { listerArticlesCentreAidePublies } from '@/centreAide/queries/listerArticlesPublies'
import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { never } from '@/framework/errors/never'
import { createOpenApiHono } from '@/framework/openapi/createOpenApiHono'
import { jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { erreur403, erreur404, succes200 } from '@/framework/openapi/responses'
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
const ModifierBrouillonBodySchema = modifierBrouillonArticleBodySchema.openapi(
  'ModifierBrouillonArticleBody',
)
const BasculerVisibiliteBodySchema = basculerVisibiliteArticleBodySchema.openapi(
  'BasculerVisibiliteArticleBody',
)
const DeplacerBodySchema = deplacerArticleBodySchema.openapi('DeplacerArticleBody')

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
  summary: 'Enregistrer le brouillon',
  description: 'Réservé aux clés API de rôle `ADMIN`. Met à jour les champs brouillon.',
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    body: {
      content: { 'application/json': { schema: ModifierBrouillonBodySchema } },
      required: true,
    },
  },
  responses: {
    200: succes200('Brouillon enregistré', ArticleApiModelSchema),
    403: erreur403,
    404: erreur404,
  },
})

// --- POST /centre-aide/articles/{id}/publier ---------------------------------

const publierRoute = createRoute({
  method: 'post',
  path: '/centre-aide/articles/{id}/publier',
  tags: ['CentreAide', 'Admin'],
  summary: 'Publier un article',
  description:
    'Réservé aux clés API de rôle `ADMIN`. Copie le brouillon vers le publié et dérive le texte de recherche.',
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: succes200('Article publié', ArticleApiModelSchema),
    403: erreur403,
    404: erreur404,
  },
})

// --- POST /centre-aide/articles/{id}/depublier -------------------------------

const depublierRoute = createRoute({
  method: 'post',
  path: '/centre-aide/articles/{id}/depublier',
  tags: ['CentreAide', 'Admin'],
  summary: 'Dépublier un article',
  description: 'Réservé aux clés API de rôle `ADMIN`.',
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    200: succes200('Article dépublié', ArticleApiModelSchema),
    403: erreur403,
    404: erreur404,
  },
})

// --- POST /centre-aide/articles/{id}/visibilite ------------------------------

const visibiliteRoute = createRoute({
  method: 'post',
  path: '/centre-aide/articles/{id}/visibilite',
  tags: ['CentreAide', 'Admin'],
  summary: 'Masquer ou ré-afficher un article',
  description: 'Réservé aux clés API de rôle `ADMIN`.',
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    body: {
      content: { 'application/json': { schema: BasculerVisibiliteBodySchema } },
      required: true,
    },
  },
  responses: {
    200: succes200('Visibilité mise à jour', ArticleApiModelSchema),
    403: erreur403,
    404: erreur404,
  },
})

// --- POST /centre-aide/articles/{id}/deplacer --------------------------------

const deplacerRoute = createRoute({
  method: 'post',
  path: '/centre-aide/articles/{id}/deplacer',
  tags: ['CentreAide', 'Admin'],
  summary: 'Déplacer un article dans l’arbre',
  description: 'Réservé aux clés API de rôle `ADMIN`. monter/descendre/entrer/sortir.',
  middleware: [requireAuthentication],
  request: {
    params: detailParamsSchema,
    body: { content: { 'application/json': { schema: DeplacerBodySchema } }, required: true },
  },
  responses: {
    200: succes200('Article déplacé', ArticleApiModelSchema),
    403: erreur403,
    404: erreur404,
  },
})

// --- DELETE /centre-aide/articles/{id} ---------------------------------------

const supprimerRoute = createRoute({
  method: 'delete',
  path: '/centre-aide/articles/{id}',
  tags: ['CentreAide', 'Admin'],
  summary: 'Supprimer un article et ses descendants',
  description: 'Réservé aux clés API de rôle `ADMIN`.',
  middleware: [requireAuthentication],
  request: { params: detailParamsSchema },
  responses: {
    204: { description: 'Article supprimé' },
    403: erreur403,
    404: erreur404,
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
  return (await withTransaction(async () => modifierBrouillonArticleCentreAide(id, body))).match(
    (data) => jsonResponseOk({ context, data, schema: ArticleApiModelSchema, status: 200 }),
    never,
  )
})

centreAideRoutes.openapi(publierRoute, async (context) => {
  const { id } = context.req.valid('param')
  return (await withTransaction(async () => publierArticleCentreAide(id))).match(
    (data) => jsonResponseOk({ context, data, schema: ArticleApiModelSchema, status: 200 }),
    never,
  )
})

centreAideRoutes.openapi(depublierRoute, async (context) => {
  const { id } = context.req.valid('param')
  return (await withTransaction(async () => depublierArticleCentreAide(id))).match(
    (data) => jsonResponseOk({ context, data, schema: ArticleApiModelSchema, status: 200 }),
    never,
  )
})

centreAideRoutes.openapi(visibiliteRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  return (await withTransaction(async () => basculerVisibiliteArticleCentreAide(id, body))).match(
    (data) => jsonResponseOk({ context, data, schema: ArticleApiModelSchema, status: 200 }),
    never,
  )
})

centreAideRoutes.openapi(deplacerRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')
  return (await withTransaction(async () => deplacerArticleCentreAide(id, body.direction))).match(
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
