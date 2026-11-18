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

// Ce qui distingue une résolution d'une autre : les textes vus par Albert, la
// forme d'une entrée du mapping (le nom de son champ d'identifiant, propre à la
// cible : `individuPublicId`, `modalitePublicId`) et le préfixe des logs.
// `Entry` est le type d'une entrée telle qu'Albert la renvoie.
export type ResolutionTarget<Entry extends { libelleSource: string }> = {
  systemPrompt: string
  labelDescription: string
  publicIdDescription: string
  mappingDescription: string
  mappingEntrySchema: (fields: {
    libelleSource: z.ZodType<string>
    publicId: z.ZodType<string>
  }) => z.ZodType<Entry>
  publicIdOf: (entry: Entry) => string
  logEvent: string
  logLabel: string
}

const makeResolutionToolSchema = <Entry extends { libelleSource: string }>({
  target,
  validPublicIds,
  labels,
}: {
  target: ResolutionTarget<Entry>
  validPublicIds: ReadonlySet<string>
  labels: ReadonlyArray<string>
}) => {
  const labelSet = new Set(labels)

  const libelleSourceSchema = z
    .string()
    .describe(target.labelDescription)
    .refine((value) => labelSet.has(value), {
      message: "libelleSource doit être l'un de ceux fournis en input (recopie exacte requise).",
    })

  const publicIdSchema = z
    .string()
    .describe(target.publicIdDescription)
    .refine((value) => validPublicIds.has(value), {
      message: 'publicId inconnu — doit appartenir à la liste fournie.',
    })

  return z.object({
    mapping: z
      .array(
        target.mappingEntrySchema({
          libelleSource: libelleSourceSchema,
          publicId: publicIdSchema,
        }),
      )
      .describe(target.mappingDescription),
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
  })
}

const validateCoverage = ({
  mapping,
  nonResolus,
  labels,
}: {
  mapping: ReadonlyArray<{ libelleSource: string }>
  nonResolus: ReadonlyArray<UnresolvedLabel>
  labels: ReadonlyArray<string>
}): ToolValidationError | null => {
  const covered = new Set<string>()
  const duplicates: string[] = []
  for (const item of mapping) {
    if (covered.has(item.libelleSource)) duplicates.push(item.libelleSource)
    covered.add(item.libelleSource)
  }
  for (const item of nonResolus) {
    if (covered.has(item.libelleSource)) duplicates.push(item.libelleSource)
    covered.add(item.libelleSource)
  }
  const missing = labels.filter((label) => !covered.has(label))
  if (missing.length === 0 && duplicates.length === 0) return null
  return {
    publicIdsInvalides: [],
    libellesNonCouverts: missing,
    libellesEnDoublon: duplicates,
  }
}

export const resolveLabels = <Entry extends { libelleSource: string }>({
  target,
  prompt,
  validPublicIds,
  labels,
  logContext,
}: {
  target: ResolutionTarget<Entry>
  prompt: string
  validPublicIds: ReadonlySet<string>
  labels: ReadonlyArray<string>
  logContext: Record<string, unknown>
}): ResultAsync<LabelResolution, ResolveLabelsError> => {
  const model = createAlbertModel()

  // Court-circuit : aucun libellé à résoudre.
  if (labels.length === 0) {
    return okAsync({ mapping: [], nonResolus: [] })
  }

  const inputSchema = makeResolutionToolSchema({ target, validPublicIds, labels })

  let lastAttempt: LabelResolution | null = null
  let lastError: ToolValidationError | null = null
  let toolCallCount = 0

  const elapsed = startTimer()
  logger.info({ event: `${target.logEvent}.start`, ...logContext }, `${target.logLabel} — début`)

  return ResultAsync.fromSafePromise(
    generateText({
      model,
      system: target.systemPrompt,
      prompt,
      tools: {
        enregistrerMapping: tool({
          description:
            'Enregistre la résolution proposée. Renvoie ok=true si la couverture est complète ' +
            'et sans doublon, sinon renvoie la liste des erreurs à corriger.',
          inputSchema,
          // eslint-disable-next-line @typescript-eslint/require-await -- l'AI SDK attend une fonction async
          execute: async ({ mapping, nonResolus }) => {
            toolCallCount += 1
            const errors = validateCoverage({ mapping, nonResolus, labels })
            if (errors) {
              lastError = errors
              logger.info(
                {
                  event: `${target.logEvent}.toolCall`,
                  tentative: toolCallCount,
                  ok: false,
                  nbMappes: mapping.length,
                  nbNonResolus: nonResolus.length,
                  nbLibellesNonCouverts: errors.libellesNonCouverts.length,
                  nbLibellesEnDoublon: errors.libellesEnDoublon.length,
                },
                'Tool call invalide — Albert va corriger',
              )
              return {
                ok: false as const,
                ...errors,
                consigne:
                  'Re-appelle `enregistrerMapping` avec un mapping/nonResolus couvrant EXACTEMENT ' +
                  'tous les libellés fournis, sans doublon.',
              }
            }
            lastAttempt = {
              mapping: mapping.map((entry) => ({
                libelleSource: entry.libelleSource,
                publicId: target.publicIdOf(entry),
              })),
              nonResolus,
            }
            lastError = null
            logger.info(
              {
                event: `${target.logEvent}.toolCall`,
                tentative: toolCallCount,
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
          event: `${target.logEvent}.done`,
          durationMs,
          toolCallCount,
          nbSteps: result.steps.length,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          succes: lastAttempt !== null,
          ...(lastAttempt
            ? {
                nbMappesFinal: lastAttempt.mapping.length,
                nbNonResolusFinal: lastAttempt.nonResolus.length,
              }
            : {}),
        },
        `${target.logLabel} — fin`,
      )
      return lastAttempt
    }),
  ).andThen((attempt): Result<LabelResolution, ResolveLabelsError> =>
    attempt ? ok(attempt) : err({ type: 'RESOLUTION_ECHEC', derniereErreur: lastError }),
  )
}
