import { type Rapprochement } from '@pilote/kpilote-shared/valeurImport'
import { generateText, stepCountIs, tool } from 'ai'
import { chunk } from 'es-toolkit'
import { z } from 'zod'

import {
  createAlbertModel,
  LOW_REASONING_OPTIONS,
  STRUCTURED_TEMPERATURE,
} from '@/framework/llm/albert'
import { logger } from '@/framework/logger/logger'
import { startTimer } from '@/framework/timer'
import { checkRapprochements } from '@/valeurImport/rules'

// Étape 2 du plan : Albert rapproche les libellés d'une colonne des individus ou
// des modalités d'un axe. Il ne reçoit que les libellés que le code n'a pas su
// rapprocher seul, et les candidats de cette colonne uniquement.

const MAX_STEPS = 4
// Lots courts : le modèle perd des libellés sur une longue liste.
const LIBELLES_PAR_LOT = 30

const rapprochementsProposesSchema = z.object({
  rapprochements: z
    .array(
      z.object({
        libelle: z.string().describe('Libellé du fichier, recopié exactement.'),
        statut: z
          .enum(['RESOLU', 'AMBIGU', 'INCONNU'])
          .describe(
            'RESOLU : un seul candidat correspond, sans doute possible. ' +
              'AMBIGU : plusieurs candidats sont plausibles. INCONNU : aucun candidat ne correspond.',
          ),
        publicId: z
          .string()
          .nullish()
          .describe('Statut RESOLU seulement : identifiant du candidat, recopié de la liste.'),
        candidats: z
          .array(z.string())
          .nullish()
          .describe('Statut AMBIGU seulement : identifiants des candidats plausibles.'),
      }),
    )
    .describe('Exactement une entrée par libellé demandé.'),
})

const SYSTEM_PROMPT = [
  'Tu rapproches des libellés tirés d’une colonne d’un fichier d’une liste de candidats connus.',
  '',
  'Pour chaque libellé, choisis un statut.',
  '- RESOLU : un seul candidat correspond sans doute possible (abréviation courante, faute de frappe, accent manquant, variante du nom). Donne son `publicId`.',
  '- AMBIGU : plusieurs candidats sont plausibles. Donne-les dans `candidats`.',
  '- INCONNU : aucun candidat ne correspond.',
  '',
  'Un mauvais rapprochement est pire qu’un libellé non résolu : dans le doute, réponds AMBIGU ou INCONNU.',
  '',
  'Exemples, avec les candidats `DEPT-13 Bouches-du-Rhône`, `DEPT-2A Corse-du-Sud`, `DEPT-2B Haute-Corse` :',
  '- « Bdr » : RESOLU, publicId `DEPT-13`.',
  '- « Corse » : AMBIGU, candidats `DEPT-2A` et `DEPT-2B`.',
  '- « Total » : INCONNU.',
  '',
  'Règles.',
  '- Une entrée par libellé demandé, ni plus ni moins. Recopie chaque libellé exactement.',
  '- N’invente aucun identifiant : seuls ceux de la liste des candidats sont acceptés.',
  '',
  'Quand tu as fini, appelle le tool `rapprocher_libelles`. S’il te renvoie des erreurs, corrige-les et rappelle-le.',
].join('\n')

export type CibleLibelles = {
  // Ce que désignent les libellés : « les individus », ou « les modalités de l'axe X ».
  description: string
  candidats: ReadonlyArray<{ id: string; nom: string }>
}

const matchLot = async ({
  cible,
  libelles,
  indicateurNom,
  abortSignal,
}: {
  cible: CibleLibelles
  libelles: ReadonlyArray<string>
  indicateurNom: string
  abortSignal?: AbortSignal | undefined
}): Promise<Record<string, Rapprochement>> => {
  let acceptes: Record<string, Rapprochement> | null = null
  let essais = 0
  const publicIdsConnus = new Set(cible.candidats.map((candidat) => candidat.id))
  const candidats = cible.candidats.map((candidat) => ({
    publicId: candidat.id,
    nom: candidat.nom,
  }))
  const elapsed = startTimer()

  const result = await generateText({
    model: createAlbertModel(),
    system: SYSTEM_PROMPT,
    prompt: [
      `Indicateur : « ${indicateurNom} ».`,
      `Les libellés désignent ${cible.description}.`,
      '',
      `Candidats (${candidats.length}) :\n${JSON.stringify(candidats, null, 2)}`,
      '',
      `Libellés à rapprocher (${libelles.length}) :\n${JSON.stringify(libelles, null, 2)}`,
    ].join('\n'),
    temperature: STRUCTURED_TEMPERATURE,
    providerOptions: LOW_REASONING_OPTIONS,
    tools: {
      rapprocher_libelles: tool({
        description:
          'Remet les rapprochements. Renvoie `ok: true` s’ils sont acceptés, sinon la liste des erreurs à corriger.',
        inputSchema: rapprochementsProposesSchema,
        // oxlint-disable-next-line typescript/require-await -- le SDK attend une fonction asynchrone
        execute: async ({ rapprochements }) => {
          essais += 1
          const checked = checkRapprochements({
            proposition: rapprochements,
            libelles,
            publicIdsConnus,
          })
          if (checked.isErr()) {
            return {
              ok: false as const,
              erreurs: checked.error.erreurs,
              consigne:
                'Corrige ces erreurs et rappelle `rapprocher_libelles` avec la liste complète.',
            }
          }
          acceptes = checked.value
          return { ok: true as const }
        },
      }),
    },
    stopWhen: [stepCountIs(MAX_STEPS), () => acceptes !== null],
    ...(abortSignal ? { abortSignal } : {}),
  })

  logger.info(
    {
      event: 'valeurImport.matchLibelles',
      durationMs: elapsed(),
      essais,
      etapes: result.steps.length,
      libelles: libelles.length,
      candidats: candidats.length,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      acceptes: acceptes !== null,
    },
    'Import : rapprochement de libellés',
  )

  // Sans réponse recevable, les libellés restent à rapprocher par l'utilisateur
  // dans la grille : l'import n'échoue pas pour autant.
  const rapprochements = acceptes as Record<string, Rapprochement> | null
  return (
    rapprochements ??
    Object.fromEntries(
      libelles.map((libelle): [string, Rapprochement] => [libelle, { statut: 'INCONNU' }]),
    )
  )
}

export const matchLibelles = async ({
  cible,
  libelles,
  indicateurNom,
  abortSignal,
}: {
  cible: CibleLibelles
  libelles: ReadonlyArray<string>
  indicateurNom: string
  abortSignal?: AbortSignal | undefined
}): Promise<Record<string, Rapprochement>> => {
  if (libelles.length === 0) return {}
  if (cible.candidats.length === 0) {
    return Object.fromEntries(
      libelles.map((libelle): [string, Rapprochement] => [libelle, { statut: 'INCONNU' }]),
    )
  }
  const lots = await Promise.all(
    chunk([...libelles], LIBELLES_PAR_LOT).map((lot) =>
      matchLot({ cible, libelles: lot, indicateurNom, abortSignal }),
    ),
  )
  return Object.assign({}, ...lots) as Record<string, Rapprochement>
}
