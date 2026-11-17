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

export type LibelleResolu = { libelleSource: string; publicId: string }
export type LibelleNonResolu = { libelleSource: string; raison: string }
export type ResolutionLibelles = {
  mapping: ReadonlyArray<LibelleResolu>
  nonResolus: ReadonlyArray<LibelleNonResolu>
}

export type ToolValidationError = {
  publicIdsInvalides: string[]
  libellesNonCouverts: string[]
  libellesEnDoublon: string[]
}

export type ResoudreLibellesError = {
  type: 'RESOLUTION_ECHEC'
  derniereErreur: ToolValidationError | null
}

// Ce qui distingue une résolution d'une autre : les textes vus par Albert, le
// nom du champ d'identifiant dans l'outil et le préfixe des événements de log.
export type CibleResolution = {
  systemPrompt: string
  champPublicId: string
  descriptionLibelle: string
  descriptionPublicId: string
  descriptionMapping: string
  evenementLog: string
  libelleLog: string
}

// Entrée du mapping telle qu'Albert la renvoie : le libellé et le publicId,
// sous le nom de champ propre à la cible (`individuPublicId`, `modalitePublicId`).
type EntreeMapping = { libelleSource: string } & Record<string, string>
type ToolInput = { mapping: EntreeMapping[]; nonResolus: LibelleNonResolu[] }

const makeResolutionToolSchema = ({
  cible,
  publicIdsValides,
  libellesSources,
}: {
  cible: CibleResolution
  publicIdsValides: ReadonlySet<string>
  libellesSources: ReadonlyArray<string>
}) => {
  const libellesSet = new Set(libellesSources)

  const libelleSourceSchema = z
    .string()
    .describe(cible.descriptionLibelle)
    .refine((value) => libellesSet.has(value), {
      message: "libelleSource doit être l'un de ceux fournis en input (recopie exacte requise).",
    })

  const publicIdSchema = z
    .string()
    .describe(cible.descriptionPublicId)
    .refine((value) => publicIdsValides.has(value), {
      message: 'publicId inconnu — doit appartenir à la liste fournie.',
    })

  // Le nom du champ d'identifiant est dynamique : zod ne peut pas le typer.
  return z.object({
    mapping: z
      .array(
        z.object({
          libelleSource: libelleSourceSchema,
          [cible.champPublicId]: publicIdSchema,
        }),
      )
      .describe(cible.descriptionMapping),
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

const validerCouverture = ({
  mapping,
  nonResolus,
  libellesSources,
}: {
  mapping: ReadonlyArray<{ libelleSource: string }>
  nonResolus: ReadonlyArray<LibelleNonResolu>
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

export const resoudreLibelles = ({
  cible,
  prompt,
  publicIdsValides,
  libellesSources,
  contexteLog,
}: {
  cible: CibleResolution
  prompt: string
  publicIdsValides: ReadonlySet<string>
  libellesSources: ReadonlyArray<string>
  contexteLog: Record<string, unknown>
}): ResultAsync<ResolutionLibelles, ResoudreLibellesError> => {
  const model = createAlbertModel()

  // Court-circuit : aucun libellé à résoudre.
  if (libellesSources.length === 0) {
    return okAsync({ mapping: [], nonResolus: [] })
  }

  const inputSchema = makeResolutionToolSchema({ cible, publicIdsValides, libellesSources })

  let derniereTentative: ResolutionLibelles | null = null
  let derniereErreur: ToolValidationError | null = null
  let nbAppelsTool = 0

  const elapsed = startTimer()
  logger.info(
    { event: `${cible.evenementLog}.start`, ...contexteLog },
    `${cible.libelleLog} — début`,
  )

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
            const erreurs = validerCouverture({ mapping, nonResolus, libellesSources })
            if (erreurs) {
              derniereErreur = erreurs
              logger.info(
                {
                  event: `${cible.evenementLog}.toolCall`,
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
                publicId: entree[cible.champPublicId]!,
              })),
              nonResolus,
            }
            derniereErreur = null
            logger.info(
              {
                event: `${cible.evenementLog}.toolCall`,
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
          event: `${cible.evenementLog}.done`,
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
        `${cible.libelleLog} — fin`,
      )
      return derniereTentative
    }),
  ).andThen((tentative): Result<ResolutionLibelles, ResoudreLibellesError> =>
    tentative ? ok(tentative) : err({ type: 'RESOLUTION_ECHEC', derniereErreur }),
  )
}
