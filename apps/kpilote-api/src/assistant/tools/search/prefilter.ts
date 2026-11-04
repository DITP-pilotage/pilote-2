import { type NamedEntity } from '@pilote/kpilote-shared/assistant/tools'

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
  candidates: ReadonlyArray<NamedEntity>,
  terms: ReadonlyArray<string>,
): NamedEntity[] => {
  const byId = new Map<string, { entite: NamedEntity; score: number }>()

  for (const candidate of candidates) {
    if (byId.has(candidate.id)) continue
    const nom = normalize(candidate.nom)
    const score = terms.filter((term) => nom.includes(term)).length
    if (score === 0) continue
    byId.set(candidate.id, { entite: candidate, score })
  }

  return [...byId.values()].sort((left, right) => right.score - left.score).map((it) => it.entite)
}

/**
 * Ne garde que les identifiants présents au catalogue réellement récupéré, déjà filtré par
 * les habilitations : un identifiant inventé par le sous-modèle reste sans effet.
 */
export const filterHallucinations = (
  ids: ReadonlyArray<string>,
  catalog: ReadonlyArray<NamedEntity>,
): NamedEntity[] => {
  const byId = new Map(catalog.map((entry) => [entry.id, entry]))
  return ids.flatMap((id) => {
    const reference = byId.get(id)
    return reference === undefined ? [] : [reference]
  })
}
