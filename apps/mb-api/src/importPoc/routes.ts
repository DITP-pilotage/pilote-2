import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { dateSchema } from '@pilote/mb-shared/dates'
import { indicateurPublicIdSchema, individuPublicIdSchema } from '@pilote/mb-shared/publicIds'

import { requireAuthentication } from '@/framework/auth/requireAuthentication'
import { logger } from '@/framework/logger/logger'
import { jsonResponseError, jsonResponseOk } from '@/framework/openapi/jsonResponse'
import { ErrorApiModelSchema, erreur400 } from '@/framework/openapi/responses'
import { appliquerPlan } from '@/importPoc/appliquerPlan'
import {
  decouverteOutputSchema,
  decouvrirStructure,
} from '@/importPoc/calls/decouvrirStructure'
import { resoudreIndividus } from '@/importPoc/calls/resoudreIndividus'
import { safeStringify } from '@/importPoc/helpers/safeStringify'
import { listIndividusForIndicateur } from '@/importPoc/queries/listIndividusForIndicateur'
import { getIndicateurByPublicId } from '@/indicateur/queries/getIndicateurByPublicId'

const MAX_ROWS = 500

const rowSchema = z
  .record(z.string(), z.unknown())
  .describe("Ligne brute du fichier (clé = en-tête, valeur = cellule).")

const normaliserBodySchema = z.object({
  rows: z
    .array(rowSchema)
    .min(1)
    .max(MAX_ROWS)
    .describe(`Lignes brutes parsées côté client (1..${MAX_ROWS}).`),
  nomFichier: z
    .string()
    .max(255)
    .optional()
    .describe('Nom du fichier source — donné en contexte au LLM.'),
})

const itemNormaliseSchema = z.object({
  individu: individuPublicIdSchema,
  date: dateSchema,
  valeur: z.number(),
})

const warningSchema = z.object({
  code: z.enum([
    'INDIVIDU_NON_RESOLU',
    'INDIVIDU_HALLUCINE',
    'DATE_INVALIDE',
    'VALEUR_INVALIDE',
    'CELLULE_VIDE',
  ]),
  message: z.string(),
  ligneSource: z.number().int().optional(),
  libelleSource: z.string().optional(),
  colonneSource: z.string().optional(),
})

const resolutionApiSchema = z.object({
  mapping: z.array(z.object({ libelleSource: z.string(), individuPublicId: z.string() })),
  nonResolus: z.array(z.object({ libelleSource: z.string(), raison: z.string() })),
})

const rapportSchema = z.object({
  totalLignes: z.number().int().nonnegative(),
  totalItemsProduits: z.number().int().nonnegative(),
  totalLibellesSources: z.number().int().nonnegative(),
  totalLibellesMappes: z.number().int().nonnegative(),
  totalLibellesNonResolus: z.number().int().nonnegative(),
})

const normaliserResponseSchema = z.object({
  plan: z.discriminatedUnion('layout', [
    decouverteOutputSchema.options[0].shape.plan.options[0],
    decouverteOutputSchema.options[0].shape.plan.options[1],
  ]),
  resolution: resolutionApiSchema,
  items: z.array(itemNormaliseSchema),
  warnings: z.array(warningSchema),
  rapport: rapportSchema,
})

const NormaliserBodySchema = normaliserBodySchema.openapi('NormaliserPocBody')
const NormaliserResponseSchema = normaliserResponseSchema.openapi('NormaliserPocResponse')

const normaliserRoute = createRoute({
  method: 'post',
  path: '/import-poc/indicateurs/{id}/normaliser',
  tags: ['ImportPoc'],
  summary: "POC v2 — Normaliser un fichier vers le format batch d'un indicateur",
  description:
    "POC d'import intelligent. Reçoit des lignes brutes (CSV/Excel parsé côté client) et utilise Albert " +
    "en 2 passes pour produire le payload batch :\n" +
    "1. Découverte de structure → plan (long/pivot, colonnes, formats).\n" +
    "2. Résolution des individus (libellé → publicId) via tool call avec schema dynamique.\n" +
    "Puis exécution déterministe en code (parsing dates/nombres). " +
    "À ce stade le POC n'écrit rien en base — il restitue le plan + items + warnings.",
  middleware: [requireAuthentication],
  request: {
    params: z.object({ id: indicateurPublicIdSchema }),
    body: {
      content: { 'application/json': { schema: NormaliserBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: NormaliserResponseSchema } },
      description: 'Plan reconnu + items normalisés + warnings + rapport.',
    },
    400: erreur400,
    503: {
      content: { 'application/json': { schema: ErrorApiModelSchema } },
      description: 'Albert non configuré ou injoignable.',
    },
  },
})

export const importPocRoutes = new OpenAPIHono()

const collectHeaders = (rows: ReadonlyArray<Record<string, unknown>>): string[] => {
  const seen = new Set<string>()
  const ordered: string[] = []
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key)
        ordered.push(key)
      }
    }
  }
  return ordered
}

importPocRoutes.openapi(normaliserRoute, async (context) => {
  const { id } = context.req.valid('param')
  const body = context.req.valid('json')

  const startedAt = performance.now()
  logger.info(
    {
      event: 'importPoc.normaliser.start',
      indicateurId: id,
      nbRows: body.rows.length,
      ...(body.nomFichier ? { nomFichier: body.nomFichier } : {}),
    },
    'POC normaliser — début',
  )

  const [indicateurResult, individusResult] = await Promise.all([
    getIndicateurByPublicId(id),
    listIndividusForIndicateur(id),
  ])

  if (indicateurResult.isErr()) {
    return jsonResponseError({
      context,
      error: { code: 'ENTITY_NOT_FOUND', message: 'Indicateur introuvable.' },
      schema: ErrorApiModelSchema,
      status: 400,
    })
  }

  const indicateur = indicateurResult.value
  const individusValides = individusResult.isOk() ? individusResult.value : []
  const headers = collectHeaders(body.rows)

  // --- Call 1 : découverte de structure ---
  const decouverteResult = await decouvrirStructure({
    indicateur: { nom: indicateur.nom, uniteLibelle: indicateur.unite?.libelle ?? null },
    headers,
    rows: body.rows,
    ...(body.nomFichier ? { nomFichier: body.nomFichier } : {}),
  })

  if (decouverteResult.isErr()) {
    const error = decouverteResult.error
    return jsonResponseError({
      context,
      error: {
        code: error.type,
        message:
          error.type === 'ALBERT_NON_CONFIGURE'
            ? "Albert n'est pas configuré côté API (ALBERT_API_KEY manquante)."
            : 'Albert injoignable ou réponse non conforme.',
      },
      schema: ErrorApiModelSchema,
      status: 503,
    })
  }

  const decouverte = decouverteResult.value
  if (decouverte.statut === 'echec') {
    return jsonResponseError({
      context,
      error: {
        code: 'PLAN_ECHEC',
        message: decouverte.explication,
        details: { raison: decouverte.raison, explication: decouverte.explication },
      },
      schema: ErrorApiModelSchema,
      status: 400,
    })
  }

  const plan = decouverte.plan

  // --- Extraction des libellés sources distincts ---
  const libellesSourcesSet = new Set<string>()
  for (const row of body.rows) {
    const valeur = row[plan.colonneIndividu]
    if (valeur === null || valeur === undefined) continue
    const libelle = safeStringify(valeur).trim()
    if (libelle) libellesSourcesSet.add(libelle)
  }
  const libellesSources = [...libellesSourcesSet]

  // --- Call 2 : résolution individus ---
  const resolutionResult = await resoudreIndividus({
    indicateur: { nom: indicateur.nom },
    individusValides,
    libellesSources,
  })

  if (resolutionResult.isErr()) {
    const error = resolutionResult.error
    if (error.type === 'RESOLUTION_ECHEC') {
      return jsonResponseError({
        context,
        error: {
          code: 'RESOLUTION_ECHEC',
          message:
            "Albert n'a pas réussi à fournir un mapping valide après plusieurs tentatives.",
          ...(error.derniereErreur ? { details: error.derniereErreur } : {}),
        },
        schema: ErrorApiModelSchema,
        status: 400,
      })
    }
    return jsonResponseError({
      context,
      error: {
        code: error.type,
        message:
          error.type === 'ALBERT_NON_CONFIGURE'
            ? "Albert n'est pas configuré côté API (ALBERT_API_KEY manquante)."
            : 'Albert injoignable ou réponse non conforme.',
      },
      schema: ErrorApiModelSchema,
      status: 503,
    })
  }

  const resolution = resolutionResult.value

  // --- Application déterministe du plan ---
  const application = appliquerPlan({
    plan,
    rows: body.rows,
    resolution,
    individusValides,
  })

  logger.info(
    {
      event: 'importPoc.normaliser.done',
      durationMs: Math.round(performance.now() - startedAt),
      indicateurId: id,
      layout: plan.layout,
      totalLignes: body.rows.length,
      totalItemsProduits: application.items.length,
      totalLibellesSources: libellesSources.length,
      totalLibellesMappes: resolution.mapping.length,
      totalLibellesNonResolus: resolution.nonResolus.length,
      totalWarnings: application.warnings.length,
    },
    'POC normaliser — succès',
  )

  return jsonResponseOk({
    context,
    data: {
      plan,
      resolution: {
        mapping: [...resolution.mapping],
        nonResolus: [...resolution.nonResolus],
      },
      items: application.items,
      warnings: application.warnings,
      rapport: {
        totalLignes: body.rows.length,
        totalItemsProduits: application.items.length,
        totalLibellesSources: libellesSources.length,
        totalLibellesMappes: resolution.mapping.length,
        totalLibellesNonResolus: resolution.nonResolus.length,
      },
    },
    schema: NormaliserResponseSchema,
    status: 200,
  })
})
