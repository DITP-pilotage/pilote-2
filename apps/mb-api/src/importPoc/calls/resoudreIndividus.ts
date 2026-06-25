import { generateText, stepCountIs, tool } from 'ai'
import { errAsync, ok, okAsync, ResultAsync } from 'neverthrow'
import { z } from 'zod'

import { logger } from '@/framework/logger/logger'
import { ALBERT_TEMPERATURE, createAlbertModel } from '@/importPoc/helpers/albert'
import { type IndividuPourImport } from '@/importPoc/queries/listIndividusForIndicateur'

const MAX_STEPS = 3

export type ResolutionEntry = { libelleSource: string; individuPublicId: string }
export type ResolutionNonResolu = { libelleSource: string; raison: string }
export type ResolutionResult = {
  mapping: ReadonlyArray<ResolutionEntry>
  nonResolus: ReadonlyArray<ResolutionNonResolu>
}

export type ResoudreIndividusError =
  | { type: 'ALBERT_NON_CONFIGURE' }
  | { type: 'ALBERT_UNAVAILABLE'; cause: unknown }
  | { type: 'RESOLUTION_ECHEC'; derniereErreur: ToolValidationError | null }

type ToolValidationError = {
  publicIdsInvalides: string[]
  libellesNonCouverts: string[]
  libellesEnDoublon: string[]
}

const makeResolutionToolSchema = ({
  individusValides,
  libellesSources,
}: {
  individusValides: ReadonlyArray<{ publicId: string }>
  libellesSources: ReadonlyArray<string>
}) => {
  const publicIdsValides = new Set(individusValides.map((individu) => individu.publicId))
  const libellesSet = new Set(libellesSources)

  const libelleSourceSchema = z
    .string()
    .describe(
      "Libellé tel qu'apparu dans la colonne individu du fichier (recopie EXACTE, " +
        'pas de reformulation).',
    )
    .refine((value) => libellesSet.has(value), {
      message: "libelleSource doit être l'un de ceux fournis en input (recopie exacte requise).",
    })

  const individuPublicIdSchema = z
    .string()
    .describe(
      "publicId d'un individu présent dans la liste fournie. " +
        "Ne JAMAIS inventer un publicId — utilise uniquement ceux fournis en contexte.",
    )
    .refine((value) => publicIdsValides.has(value), {
      message: "publicId inconnu — doit appartenir à la liste fournie.",
    })

  return z.object({
    mapping: z
      .array(
        z.object({
          libelleSource: libelleSourceSchema,
          individuPublicId: individuPublicIdSchema,
        }),
      )
      .describe(
        "Liste des libellés que tu as su rattacher avec confiance à un individu connu. " +
          "Un même libellé ne doit pas apparaître plusieurs fois.",
      ),
    nonResolus: z
      .array(
        z.object({
          libelleSource: libelleSourceSchema,
          raison: z
            .string()
            .describe(
              "Phrase courte en français : pourquoi tu n'as pas pu rattacher ce libellé " +
                "(ambiguïté, libellé inconnu, manque de contexte, etc.).",
            ),
        }),
      )
      .describe(
        "Libellés que tu n'as PAS su rattacher avec confiance. " +
          "L'union mapping + nonResolus doit couvrir EXACTEMENT tous les libellés fournis.",
      ),
  })
}

const validerCouverture = ({
  mapping,
  nonResolus,
  libellesSources,
}: {
  mapping: ReadonlyArray<ResolutionEntry>
  nonResolus: ReadonlyArray<ResolutionNonResolu>
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

const SYSTEM_PROMPT =
  "Tu reçois une liste de libellés bruts (libellésSources) provenant d'une colonne d'un fichier " +
  "de données téléversé. Ces libellés font référence à des individus connus (territoires, entités).\n" +
  "\n" +
  "Règles strictes :\n" +
  "- N'invente JAMAIS un publicId. Seuls les publicId présents dans la liste fournie sont autorisés.\n" +
  "- Recopie EXACTEMENT chaque libelleSource tel qu'apparu dans la liste (pas de reformulation).\n" +
  "- Chaque libelleSource doit apparaître exactement une fois dans mapping OU dans nonResolus.\n" +
  "- Utilise les métadonnées (codeInsee notamment) pour désambiguïser.\n" +
  "- Pour les abréviations courantes (IDF, Bdr, P-de-D, etc.), résous SI tu es certain ; sinon non résolu.\n" +
  "\n" +
  "Quand tu as terminé, appelle l'outil `enregistrerMapping` avec ta proposition.\n" +
  "Si l'outil te signale des erreurs, corrige et rappelle-le."

export const resoudreIndividus = ({
  indicateur,
  individusValides,
  libellesSources,
}: {
  indicateur: { nom: string }
  individusValides: ReadonlyArray<IndividuPourImport>
  libellesSources: ReadonlyArray<string>
}): ResultAsync<ResolutionResult, ResoudreIndividusError> => {
  const model = createAlbertModel()
  if (!model) return errAsync({ type: 'ALBERT_NON_CONFIGURE' })

  // Court-circuit : aucun libellé à résoudre.
  if (libellesSources.length === 0) {
    return okAsync({ mapping: [], nonResolus: [] })
  }

  const inputSchema = makeResolutionToolSchema({ individusValides, libellesSources })

  const individusContexte = individusValides.map((individu) => ({
    publicId: individu.publicId,
    nom: individu.nom,
    referentiel: individu.referentielPublicId,
  }))

  const prompt = [
    `Indicateur : « ${indicateur.nom} ».`,
    '',
    `Individus connus (${individusContexte.length}) :`,
    JSON.stringify(individusContexte, null, 2),
    '',
    `Libellés sources à mapper (${libellesSources.length}) :`,
    JSON.stringify([...libellesSources], null, 2),
  ].join('\n')

  let derniereTentative: ResolutionResult | null = null
  let derniereErreur: ToolValidationError | null = null
  let nbAppelsTool = 0

  const startedAt = performance.now()
  logger.info(
    {
      event: 'importPoc.resoudreIndividus.start',
      indicateurNom: indicateur.nom,
      nbIndividusValides: individusValides.length,
      nbLibellesSources: libellesSources.length,
    },
    'Albert call 2 (résolution) — début',
  )

  return ResultAsync.fromPromise(
    generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt,
      tools: {
        enregistrerMapping: tool({
          description:
            "Enregistre la résolution proposée. Renvoie ok=true si la couverture est complète " +
            "et sans doublon, sinon renvoie la liste des erreurs à corriger.",
          inputSchema,
          // eslint-disable-next-line @typescript-eslint/require-await -- l'AI SDK attend une fonction async
          execute: async ({ mapping, nonResolus }) => {
            nbAppelsTool += 1
            const erreurs = validerCouverture({ mapping, nonResolus, libellesSources })
            if (erreurs) {
              derniereErreur = erreurs
              logger.info(
                {
                  event: 'importPoc.resoudreIndividus.toolCall',
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
                  "Re-appelle `enregistrerMapping` avec un mapping/nonResolus couvrant EXACTEMENT " +
                  "tous les libellés fournis, sans doublon.",
              }
            }
            derniereTentative = { mapping, nonResolus }
            derniereErreur = null
            logger.info(
              {
                event: 'importPoc.resoudreIndividus.toolCall',
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
      temperature: ALBERT_TEMPERATURE,
    }).then((result) => {
      const durationMs = Math.round(performance.now() - startedAt)
      logger.info(
        {
          event: 'importPoc.resoudreIndividus.done',
          durationMs,
          nbAppelsTool,
          nbSteps: result.steps.length,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          succes: derniereTentative !== null,
          ...(derniereTentative
            ? { nbMappesFinal: derniereTentative.mapping.length, nbNonResolusFinal: derniereTentative.nonResolus.length }
            : {}),
        },
        'Albert call 2 (résolution) — fin',
      )
      if (derniereTentative) return ok(derniereTentative)
      return ok<ResolutionResult, ResoudreIndividusError>(null as never)
    }),
    (cause): ResoudreIndividusError => {
      logger.error(
        {
          event: 'importPoc.resoudreIndividus.error',
          durationMs: Math.round(performance.now() - startedAt),
          cause: cause instanceof Error ? cause.message : String(cause),
        },
        'Albert call 2 (résolution) — échec',
      )
      return { type: 'ALBERT_UNAVAILABLE', cause }
    },
  ).andThen(() => {
    if (derniereTentative) return okAsync<ResolutionResult, ResoudreIndividusError>(derniereTentative)
    return errAsync<ResolutionResult, ResoudreIndividusError>({
      type: 'RESOLUTION_ECHEC',
      derniereErreur,
    })
  })
}
