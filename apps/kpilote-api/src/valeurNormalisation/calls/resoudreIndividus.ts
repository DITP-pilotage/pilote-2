import { type ResultAsync } from 'neverthrow'
import { z } from 'zod'

import {
  type ResolutionTarget,
  resolveLabels,
  type ResolveLabelsError,
} from '@/valeurNormalisation/calls/resolveLabels'
import { type IndividuPourImport } from '@/valeurNormalisation/queries/listIndividusForIndicateur'

export type ResolutionEntry = { libelleSource: string; individuPublicId: string }
export type ResolutionNonResolu = { libelleSource: string; raison: string }
export type ResolutionResult = {
  mapping: ReadonlyArray<ResolutionEntry>
  nonResolus: ReadonlyArray<ResolutionNonResolu>
}

export type ResoudreIndividusError = ResolveLabelsError

const INDIVIDUS_TARGET: ResolutionTarget<{ libelleSource: string; individuPublicId: string }> = {
  systemPrompt:
    "Tu reçois une liste de libellés bruts (libellésSources) provenant d'une colonne d'un fichier " +
    'de données téléversé. Ces libellés font référence à des individus connus (territoires, entités).\n' +
    '\n' +
    'Règles strictes :\n' +
    "- N'invente JAMAIS un publicId. Seuls les publicId présents dans la liste fournie sont autorisés.\n" +
    "- Recopie EXACTEMENT chaque libelleSource tel qu'apparu dans la liste (pas de reformulation).\n" +
    '- Chaque libelleSource doit apparaître exactement une fois dans mapping OU dans nonResolus.\n' +
    '- Utilise les métadonnées (codeInsee notamment) pour désambiguïser.\n' +
    '- Pour les abréviations courantes (IDF, Bdr, P-de-D, etc.), résous SI tu es certain ; sinon non résolu.\n' +
    '\n' +
    "Quand tu as terminé, appelle l'outil `enregistrerMapping` avec ta proposition.\n" +
    "Si l'outil te signale des erreurs, corrige et rappelle-le.",
  labelDescription:
    "Libellé tel qu'apparu dans la colonne individu du fichier (recopie EXACTE, " +
    'pas de reformulation).',
  publicIdDescription:
    "publicId d'un individu présent dans la liste fournie. " +
    'Ne JAMAIS inventer un publicId — utilise uniquement ceux fournis en contexte.',
  mappingDescription:
    'Liste des libellés que tu as su rattacher avec confiance à un individu connu. ' +
    'Un même libellé ne doit pas apparaître plusieurs fois.',
  mappingEntrySchema: ({ libelleSource, publicId }) =>
    z.object({ libelleSource, individuPublicId: publicId }),
  publicIdOf: (entry) => entry.individuPublicId,
  logEvent: 'importPoc.resoudreIndividus',
  logLabel: 'Albert call 2 (résolution)',
}

export const resoudreIndividus = ({
  indicateur,
  individusValides,
  libellesSources,
}: {
  indicateur: { nom: string }
  individusValides: ReadonlyArray<IndividuPourImport>
  libellesSources: ReadonlyArray<string>
}): ResultAsync<ResolutionResult, ResoudreIndividusError> => {
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

  return resolveLabels({
    target: INDIVIDUS_TARGET,
    prompt,
    validPublicIds: new Set(individusValides.map((individu) => individu.publicId)),
    labels: libellesSources,
    logContext: {
      indicateurNom: indicateur.nom,
      nbIndividusValides: individusValides.length,
      nbLibellesSources: libellesSources.length,
    },
  }).map(({ mapping, nonResolus }) => ({
    mapping: mapping.map(({ libelleSource, publicId }) => ({
      libelleSource,
      individuPublicId: publicId,
    })),
    nonResolus,
  }))
}
