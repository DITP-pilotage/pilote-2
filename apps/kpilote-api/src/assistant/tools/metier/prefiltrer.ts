import { type EntiteTrouvee } from '@pilote/kpilote-shared/assistant/tools'

const LONGUEUR_MIN_TERME = 3

// Mots vides français les plus fréquents dans une formulation de recherche. La liste est
// volontairement courte : un mot vide oublié coûte un appel de filtre en plus, pas un
// résultat faux.
const MOTS_VIDES = new Set([
  'les',
  'des',
  'une',
  'nos',
  'vos',
  'leur',
  'leurs',
  'pour',
  'avec',
  'dans',
  'sur',
  'par',
  'que',
  'qui',
  'quoi',
  'est',
  'sont',
  'ont',
  'aux',
  'ses',
  'mes',
  'tes',
  'ces',
  'cet',
  'cette',
  'indicateur',
  'indicateurs',
  'collection',
  'collections',
])

const DIACRITIQUES = /[̀-ͯ]/gu

export const normaliser = (texte: string): string =>
  texte.normalize('NFD').replace(DIACRITIQUES, '').toLowerCase()

/**
 * Découpe la formulation de l'utilisateur en termes exploitables par le filtre `recherche`
 * de l'API. Les mots vides et les termes trop courts sont retirés : ils ramèneraient tout
 * le catalogue et ne discriminent rien.
 */
export const decouperEnTermes = (requete: string): string[] => {
  const termes = normaliser(requete)
    .split(/[^a-z0-9]+/u)
    .filter((terme) => terme.length >= LONGUEUR_MIN_TERME && !MOTS_VIDES.has(terme))
  return [...new Set(termes)]
}

/**
 * Classe l'union des résultats de filtre par nombre de termes satisfaits, décroissant.
 * Les candidats qui n'en satisfont aucun sont écartés — ils viennent d'un appel dont le
 * terme matchait ailleurs.
 */
export const classerParTermesSatisfaits = (
  candidats: ReadonlyArray<EntiteTrouvee>,
  termes: ReadonlyArray<string>,
): EntiteTrouvee[] => {
  const parId = new Map<string, { entite: EntiteTrouvee; score: number }>()

  for (const candidat of candidats) {
    if (parId.has(candidat.publicId)) continue
    const nom = normaliser(candidat.nom)
    const score = termes.filter((terme) => nom.includes(terme)).length
    if (score === 0) continue
    parId.set(candidat.publicId, { entite: candidat, score })
  }

  return [...parId.values()]
    .sort((gauche, droite) => droite.score - gauche.score)
    .map((entree) => entree.entite)
}

/**
 * Ne garde que les candidats présents au catalogue réellement récupéré. Un sous-modèle peut
 * inventer un identifiant plausible ; le catalogue, lui, est déjà filtré par les
 * habilitations. C'est le garde-fou qui rend l'invention sans effet.
 */
export const filtrerHallucinations = <TCandidat, TReference extends { publicId: string }>(
  candidats: ReadonlyArray<TCandidat>,
  catalogue: ReadonlyArray<TReference>,
  obtenirId: (candidat: TCandidat) => string,
): TReference[] => {
  const parId = new Map(catalogue.map((entree) => [entree.publicId, entree]))
  return candidats.flatMap((candidat) => {
    const reference = parId.get(obtenirId(candidat))
    return reference === undefined ? [] : [reference]
  })
}
