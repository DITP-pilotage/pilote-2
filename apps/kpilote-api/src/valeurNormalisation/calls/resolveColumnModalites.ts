import { okAsync, type ResultAsync } from 'neverthrow'
import { z } from 'zod'

import { matchModalites } from '@/valeurNormalisation/axeColumns'
import {
  type ResolutionTarget,
  type LabelResolution,
  resolveLabels,
  type ResolveLabelsError,
} from '@/valeurNormalisation/calls/resolveLabels'
import { type AxeForImport } from '@/valeurNormalisation/queries/listAxesForIndicateur'

const MODALITES_TARGET: ResolutionTarget<{ libelleSource: string; modalitePublicId: string }> = {
  systemPrompt:
    "Tu reçois une liste de libellés bruts (libellésSources) provenant d'une colonne d'un fichier " +
    "de données téléversé. Ces libellés désignent des modalités d'UN axe de l'indicateur " +
    '(ex. des opérateurs, des types de fraude), et uniquement de cet axe.\n' +
    '\n' +
    'Règles strictes :\n' +
    "- N'invente JAMAIS un publicId. Seuls les publicId des modalités fournies sont autorisés.\n" +
    "- Recopie EXACTEMENT chaque libelleSource tel qu'apparu dans la liste (pas de reformulation).\n" +
    '- Chaque libelleSource doit apparaître exactement une fois dans mapping OU dans nonResolus.\n' +
    '- Pour les abréviations et variantes courantes, résous SI tu es certain ; sinon non résolu.\n' +
    '\n' +
    "Quand tu as terminé, appelle l'outil `enregistrerMapping` avec ta proposition.\n" +
    "Si l'outil te signale des erreurs, corrige et rappelle-le.",
  labelDescription:
    "Libellé tel qu'apparu dans la colonne de l'axe (recopie EXACTE, pas de reformulation).",
  publicIdDescription:
    "publicId d'une modalité présente dans la liste fournie. " +
    'Ne JAMAIS inventer un publicId — utilise uniquement ceux fournis en contexte.',
  mappingDescription:
    "Liste des libellés que tu as su rattacher avec confiance à une modalité de l'axe. " +
    'Un même libellé ne doit pas apparaître plusieurs fois.',
  mappingEntrySchema: ({ libelleSource, publicId }) =>
    z.object({ libelleSource, modalitePublicId: publicId }),
  publicIdOf: (entry) => entry.modalitePublicId,
  logEvent: 'importPoc.resolveColumnModalites',
  logLabel: 'Albert (résolution des modalités)',
}

// Résout les libellés d'une colonne d'axe contre les modalités feuilles de cet
// axe uniquement (« Orange » l'opérateur n'est pas « Orange » la commune) :
// d'abord par correspondance exacte (publicId ou nom), puis par Albert pour les
// libellés restants.
export const resolveColumnModalites = ({
  indicateur,
  axe,
  column,
  labels,
}: {
  indicateur: { nom: string }
  axe: AxeForImport
  column: string
  labels: ReadonlyArray<string>
}): ResultAsync<LabelResolution, ResolveLabelsError> => {
  const { mapping, remaining } = matchModalites({ labels, modalites: axe.modalitesFeuilles })
  if (remaining.length === 0) return okAsync({ mapping, nonResolus: [] })

  const prompt = [
    `Indicateur : « ${indicateur.nom} ».`,
    `Axe : « ${axe.nom} » (colonne « ${column} » du fichier).`,
    '',
    `Modalités de l'axe (${axe.modalitesFeuilles.length}) :`,
    JSON.stringify(axe.modalitesFeuilles, null, 2),
    '',
    `Libellés sources à mapper (${remaining.length}) :`,
    JSON.stringify(remaining, null, 2),
  ].join('\n')

  return resolveLabels({
    target: MODALITES_TARGET,
    prompt,
    validPublicIds: new Set(axe.modalitesFeuilles.map((modalite) => modalite.publicId)),
    labels: remaining,
    logContext: {
      indicateurNom: indicateur.nom,
      axe: axe.publicId,
      nbModalites: axe.modalitesFeuilles.length,
      nbLibellesSources: remaining.length,
    },
  }).map((resolution) => ({
    mapping: [...mapping, ...resolution.mapping],
    nonResolus: resolution.nonResolus,
  }))
}
