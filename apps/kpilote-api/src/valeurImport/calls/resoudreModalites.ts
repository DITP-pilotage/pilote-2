import { okAsync, type ResultAsync } from 'neverthrow'

import { rapprocherModalites } from '@/valeurImport/colonnesAxes'
import {
  type CibleResolution,
  type ResolutionLibelles,
  resoudreLibelles,
  type ResoudreLibellesError,
} from '@/valeurImport/calls/resoudreLibelles'
import { type AxePourImport } from '@/valeurImport/queries/listAxesForIndicateur'

const CIBLE_MODALITES: CibleResolution = {
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
  champPublicId: 'modalitePublicId',
  descriptionLibelle:
    "Libellé tel qu'apparu dans la colonne de l'axe (recopie EXACTE, pas de reformulation).",
  descriptionPublicId:
    "publicId d'une modalité présente dans la liste fournie. " +
    'Ne JAMAIS inventer un publicId — utilise uniquement ceux fournis en contexte.',
  descriptionMapping:
    "Liste des libellés que tu as su rattacher avec confiance à une modalité de l'axe. " +
    'Un même libellé ne doit pas apparaître plusieurs fois.',
  evenementLog: 'importPoc.resoudreModalites',
  libelleLog: 'Albert (résolution des modalités)',
}

// Résout les libellés d'une colonne d'axe contre les modalités feuilles de cet
// axe uniquement (« Orange » l'opérateur n'est pas « Orange » la commune) :
// d'abord par correspondance exacte (publicId ou nom), puis par Albert pour les
// libellés restants.
export const resoudreModalites = ({
  indicateur,
  axe,
  colonne,
  libellesSources,
}: {
  indicateur: { nom: string }
  axe: AxePourImport
  colonne: string
  libellesSources: ReadonlyArray<string>
}): ResultAsync<ResolutionLibelles, ResoudreLibellesError> => {
  const { mapping, restants } = rapprocherModalites({
    libelles: libellesSources,
    modalites: axe.modalitesFeuilles,
  })
  if (restants.length === 0) return okAsync({ mapping, nonResolus: [] })

  const prompt = [
    `Indicateur : « ${indicateur.nom} ».`,
    `Axe : « ${axe.nom} » (colonne « ${colonne} » du fichier).`,
    '',
    `Modalités de l'axe (${axe.modalitesFeuilles.length}) :`,
    JSON.stringify(axe.modalitesFeuilles, null, 2),
    '',
    `Libellés sources à mapper (${restants.length}) :`,
    JSON.stringify(restants, null, 2),
  ].join('\n')

  return resoudreLibelles({
    cible: CIBLE_MODALITES,
    prompt,
    publicIdsValides: new Set(axe.modalitesFeuilles.map((modalite) => modalite.publicId)),
    libellesSources: restants,
    contexteLog: {
      indicateurNom: indicateur.nom,
      axe: axe.publicId,
      nbModalites: axe.modalitesFeuilles.length,
      nbLibellesSources: restants.length,
    },
  }).map((resolution) => ({
    mapping: [...mapping, ...resolution.mapping],
    nonResolus: resolution.nonResolus,
  }))
}
