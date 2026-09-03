import { type FoundEntite } from '@pilote/kpilote-shared/assistant/tools'

const MIN_TERM_LENGTH = 3

// Mots vides français les plus fréquents dans une formulation de recherche. La liste est
// volontairement courte : un mot vide oublié coûte un appel de filtre en plus, pas un
// résultat faux.
const STOP_WORDS = new Set([
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

const DIACRITICS = /[̀-ͯ]/gu

export const normalize = (text: string): string =>
  text.normalize('NFD').replace(DIACRITICS, '').toLowerCase()

/**
 * Découpe la formulation de l'utilisateur en termes exploitables par le filtre `recherche`
 * de l'API. Les mots vides et les termes trop courts sont retirés : ils ramèneraient tout
 * le catalogue et ne discriminent rien.
 */
export const splitIntoTerms = (query: string): string[] => {
  const terms = normalize(query)
    .split(/[^a-z0-9]+/u)
    .filter((term) => term.length >= MIN_TERM_LENGTH && !STOP_WORDS.has(term))
  return [...new Set(terms)]
}

/**
 * Classe l'union des résultats de filtre par nombre de termes satisfaits, décroissant.
 * Les candidats qui n'en satisfont aucun sont écartés — ils viennent d'un appel dont le
 * terme matchait ailleurs.
 */
export const rankByMatchedTerms = (
  candidates: ReadonlyArray<FoundEntite>,
  terms: ReadonlyArray<string>,
): FoundEntite[] => {
  const byId = new Map<string, { entite: FoundEntite; score: number }>()

  for (const candidate of candidates) {
    if (byId.has(candidate.publicId)) continue
    const nom = normalize(candidate.nom)
    const score = terms.filter((term) => nom.includes(term)).length
    if (score === 0) continue
    byId.set(candidate.publicId, { entite: candidate, score })
  }

  return [...byId.values()].sort((left, right) => right.score - left.score).map((it) => it.entite)
}

/**
 * Ne garde que les candidats présents au catalogue réellement récupéré. Un sous-modèle peut
 * inventer un identifiant plausible ; le catalogue, lui, est déjà filtré par les
 * habilitations. C'est le garde-fou qui rend l'invention sans effet.
 */
export const filterHallucinations = <TCandidate, TReference extends { publicId: string }>(
  candidates: ReadonlyArray<TCandidate>,
  catalog: ReadonlyArray<TReference>,
  getId: (candidate: TCandidate) => string,
): TReference[] => {
  const byId = new Map(catalog.map((entry) => [entry.publicId, entry]))
  return candidates.flatMap((candidate) => {
    const reference = byId.get(getId(candidate))
    return reference === undefined ? [] : [reference]
  })
}
