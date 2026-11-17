import { type ResultAsync } from 'neverthrow'

import {
  type CibleResolution,
  resoudreLibelles,
  type ResoudreLibellesError,
} from '@/valeurImport/calls/resoudreLibelles'
import { type IndividuPourImport } from '@/valeurImport/queries/listIndividusForIndicateur'

export type ResolutionEntry = { libelleSource: string; individuPublicId: string }
export type ResolutionNonResolu = { libelleSource: string; raison: string }
export type ResolutionResult = {
  mapping: ReadonlyArray<ResolutionEntry>
  nonResolus: ReadonlyArray<ResolutionNonResolu>
}

export type ResoudreIndividusError = ResoudreLibellesError

const CIBLE_INDIVIDUS: CibleResolution = {
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
  champPublicId: 'individuPublicId',
  descriptionLibelle:
    "Libellé tel qu'apparu dans la colonne individu du fichier (recopie EXACTE, " +
    'pas de reformulation).',
  descriptionPublicId:
    "publicId d'un individu présent dans la liste fournie. " +
    'Ne JAMAIS inventer un publicId — utilise uniquement ceux fournis en contexte.',
  descriptionMapping:
    'Liste des libellés que tu as su rattacher avec confiance à un individu connu. ' +
    'Un même libellé ne doit pas apparaître plusieurs fois.',
  evenementLog: 'importPoc.resoudreIndividus',
  libelleLog: 'Albert call 2 (résolution)',
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

  return resoudreLibelles({
    cible: CIBLE_INDIVIDUS,
    prompt,
    publicIdsValides: new Set(individusValides.map((individu) => individu.publicId)),
    libellesSources,
    contexteLog: {
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
