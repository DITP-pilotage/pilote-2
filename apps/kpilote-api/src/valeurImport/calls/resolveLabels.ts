import { generateText, stepCountIs, tool } from 'ai'
import { err, ok, okAsync, type Result, ResultAsync } from 'neverthrow'
import { z } from 'zod'

import { logger } from '@/framework/logger/logger'
import { startTimer } from '@/framework/timer'
import { createAlbertModel, STRUCTURED_TEMPERATURE } from '@/framework/llm/albert'

// Boucle de résolution commune aux individus et aux modalités : Albert rattache
// des libellés bruts d'une colonne à des publicIds connus via l'outil
// `enregistrerMapping`, qui vérifie que chaque libellé est couvert exactement
// une fois. Albert se corrige dans la limite de MAX_STEPS.

const MAX_STEPS = 3

export type ResolvedLabel = { libelleSource: string; publicId: string }
export type UnresolvedLabel = { libelleSource: string; raison: string }
export type LabelResolution = {
  mapping: ReadonlyArray<ResolvedLabel>
  nonResolus: ReadonlyArray<UnresolvedLabel>
}

export type ToolValidationError = {
  publicIdsInvalides: string[]
  libellesNonCouverts: string[]
  libellesEnDoublon: string[]
}

export type ResolveLabelsError = {
  type: 'RESOLUTION_ECHEC'
  derniereErreur: ToolValidationError | null
}

// Ce qui distingue une résolution d'une autre : les textes vus par Albert, le
// nom du champ d'identifiant dans l'outil et le préfixe des événements de log.
export type ResolutionTarget = {
  systemPrompt: string
  publicIdField: string
  labelDescription: string
  publicIdDescription: string
  mappingDescription: string
  logEvent: string
  logLabel: string
}

// Entrée du mapping telle qu'Albert la renvoie : le libellé et le publicId,
// sous le nom de champ propre à la cible (`individuPublicId`, `modalitePublicId`).
type MappingEntry = { libelleSource: string } & Record<string, string>
type ToolInput = { mapping: MappingEntry[]; nonResolus: UnresolvedLabel[] }

const makeResolutionToolSchema = ({
  cible,
  publicIdsValides,
  libellesSources,
}: {
  cible: ResolutionTarget
  publicIdsValides: ReadonlySet<string>
  libellesSources: ReadonlyArray<string>
}) => {
  const libellesSet = new Set(libellesSources)

  const libelleSourceSchema = z
    .string()
    .describe(cible.labelDescription)
    .refine((value) => libellesSet.has(value), {
      message: "libelleSource doit être l'un de ceux fournis en input (recopie exacte requise).",
    })

  const publicIdSchema = z
    .string()
    .describe(cible.publicIdDescription)
    .refine((value) => publicIdsValides.has(value), {
      message: 'publicId inconnu — doit appartenir à la liste fournie.',
    })

  // Le nom du champ d'identifiant est dynamique : zod ne peut pas le typer.
  return z.object({
    mapping: z
      .array(
        z.object({
          libelleSource: libelleSourceSchema,
          [cible.publicIdField]: publicIdSchema,
        }),
      )
      .describe(cible.mappingDescription),
    nonResolus: z
      .array(
        z.object({
          libelleSource: libelleSourceSchema,
          raison: z
            .string()
            .describe(
              "Phrase courte en français : pourquoi tu n'as pas pu rattacher ce libellé " +
                '(ambiguïté, libellé inconnu, manque de contexte, etc.).',
            ),
        }),
      )
      .describe(
        "Libellés que tu n'as PAS su rattacher avec confiance. " +
          "L'union mapping + nonResolus doit couvrir EXACTEMENT tous les libellés fournis.",
      ),
  }) as unknown as z.ZodType<ToolInput>
}

const validateCoverage = ({
  mapping,
  nonResolus,
  libellesSources,
}: {
  mapping: ReadonlyArray<{ libelleSource: string }>
  nonResolus: ReadonlyArray<UnresolvedLabel>
  libellesSources: ReadonlyArray<string>
}): ToolValidationError | null => {
  const couverts = new Set<string>()
  const doublons: string[] = []
  for (const item of mapping) {
    if (couverts.has(item.libelleSource)) doublons.push(item.libelleSource)
    couverts.add(item.libelleSource)
  }
  for (const item of nonResolus) {
    if (couverts.has(item.libelleSource)) doublons.push(item.libelleSource)
    couverts.add(item.libelleSource)
  }
  const manquants = libellesSources.filter((libelle) => !couverts.has(libelle))
  if (manquants.length === 0 && doublons.length === 0) return null
  return {
    publicIdsInvalides: [],
    libellesNonCouverts: manquants,
    libellesEnDoublon: doublons,
  }
}

export const resolveLabels = ({
  cible,
  prompt,
  publicIdsValides,
  libellesSources,
  logContext,
}: {
  cible: ResolutionTarget
  prompt: string
  publicIdsValides: ReadonlySet<string>
  libellesSources: ReadonlyArray<string>
  logContext: Record<string, unknown>
}): ResultAsync<LabelResolution, ResolveLabelsError> => {
  const model = createAlbertModel()

  // Court-circuit : aucun libellé à résoudre.
  if (libellesSources.length === 0) {
    return okAsync({ mapping: [], nonResolus: [] })
  }

  const inputSchema = makeResolutionToolSchema({ cible, publicIdsValides, libellesSources })

  let derniereTentative: LabelResolution | null = null
  let derniereErreur: ToolValidationError | null = null
  let nbAppelsTool = 0

  const elapsed = startTimer()
  logger.info({ event: `${cible.logEvent}.start`, ...logContext }, `${cible.logLabel} — début`)

  return ResultAsync.fromSafePromise(
    generateText({
      model,
      system: cible.systemPrompt,
      prompt,
      tools: {
        enregistrerMapping: tool({
          description:
            'Enregistre la résolution proposée. Renvoie ok=true si la couverture est complète ' +
            'et sans doublon, sinon renvoie la liste des erreurs à corriger.',
          inputSchema,
          // eslint-disable-next-line @typescript-eslint/require-await -- l'AI SDK attend une fonction async
          execute: async ({ mapping, nonResolus }) => {
            nbAppelsTool += 1
            const erreurs = validateCoverage({ mapping, nonResolus, libellesSources })
            if (erreurs) {
              derniereErreur = erreurs
              logger.info(
                {
                  event: `${cible.logEvent}.toolCall`,
                  tentative: nbAppelsTool,
                  ok: false,
                  nbMappes: mapping.length,
                  nbNonResolus: nonResolus.length,
                  nbLibellesNonCouverts: erreurs.libellesNonCouverts.length,
                  nbLibellesEnDoublon: erreurs.libellesEnDoublon.length,
                },
                'Tool call invalide — Albert va corriger',
              )
              return {
                ok: false as const,
                ...erreurs,
                consigne:
                  'Re-appelle `enregistrerMapping` avec un mapping/nonResolus couvrant EXACTEMENT ' +
                  'tous les libellés fournis, sans doublon.',
              }
            }
            derniereTentative = {
              mapping: mapping.map((entree) => ({
                libelleSource: entree.libelleSource,
                publicId: entree[cible.publicIdField]!,
              })),
              nonResolus,
            }
            derniereErreur = null
            logger.info(
              {
                event: `${cible.logEvent}.toolCall`,
                tentative: nbAppelsTool,
                ok: true,
                nbMappes: mapping.length,
                nbNonResolus: nonResolus.length,
              },
              'Tool call valide',
            )
            return { ok: true as const }
          },
        }),
      },
      stopWhen: stepCountIs(MAX_STEPS),
      temperature: STRUCTURED_TEMPERATURE,
    }).then((result) => {
      const durationMs = elapsed()
      logger.info(
        {
          event: `${cible.logEvent}.done`,
          durationMs,
          nbAppelsTool,
          nbSteps: result.steps.length,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          succes: derniereTentative !== null,
          ...(derniereTentative
            ? {
                nbMappesFinal: derniereTentative.mapping.length,
                nbNonResolusFinal: derniereTentative.nonResolus.length,
              }
            : {}),
        },
        `${cible.logLabel} — fin`,
      )
      return derniereTentative
    }),
  ).andThen((tentative): Result<LabelResolution, ResolveLabelsError> =>
    tentative ? ok(tentative) : err({ type: 'RESOLUTION_ECHEC', derniereErreur }),
  )
}
