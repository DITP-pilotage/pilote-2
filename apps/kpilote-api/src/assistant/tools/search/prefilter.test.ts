import { describe, expect, it } from 'vitest'

import {
  rankByMatchedTerms,
  splitIntoTerms,
  MAX_SEARCH_TERMS,
  filterHallucinations,
} from '@/assistant/tools/search/prefilter'

describe('splitIntoTerms', () => {
  it('met en minuscules en gardant les accents, que la base compare tels quels', () => {
    expect(splitIntoTerms('Délais DE Paiement')).toEqual(['délais', 'paiement'])
  })

  it('retire les mots vides et les termes trop courts', () => {
    expect(splitIntoTerms("l'indicateur sur la fraude fiscale")).toEqual(['fraude', 'fiscale'])
  })

  it('dédoublonne', () => {
    expect(splitIntoTerms('fraude fraude fiscale')).toEqual(['fraude', 'fiscale'])
  })

  it('borne le nombre de termes, et donc de requêtes du pré-filtre', () => {
    const query = Array.from({ length: 30 }, (_, index) => `terme${index}`).join(' ')
    expect(splitIntoTerms(query)).toHaveLength(MAX_SEARCH_TERMS)
  })

  it('renvoie un tableau vide sur une requête sans terme exploitable', () => {
    expect(splitIntoTerms('et le ?')).toEqual([])
  })
})

describe('rankByMatchedTerms', () => {
  const candidats = [
    { id: 'IND-1', nom: 'Recouvrement de la fraude fiscale' },
    { id: 'IND-2', nom: 'Fraude aux prestations' },
    { id: 'IND-3', nom: 'Délais de paiement' },
  ]

  it('place devant les candidats qui satisfont le plus de termes', () => {
    const classes = rankByMatchedTerms(candidats, ['fraude', 'fiscale'])
    expect(classes.map((candidat) => candidat.id)).toEqual(['IND-1', 'IND-2'])
  })

  it('écarte les candidats qui ne satisfont aucun terme', () => {
    const classes = rankByMatchedTerms(candidats, ['paiement'])
    expect(classes.map((candidat) => candidat.id)).toEqual(['IND-3'])
  })

  it('est insensible à la casse et aux diacritiques du candidat', () => {
    const classes = rankByMatchedTerms([{ id: 'IND-9', nom: 'DÉLAIS' }], ['delais'])
    expect(classes).toHaveLength(1)
  })

  it('dédoublonne sur id quand un candidat vient de plusieurs appels', () => {
    const meme = { id: 'IND-1', nom: 'Recouvrement de la fraude fiscale' }
    expect(rankByMatchedTerms([meme, meme], ['fraude'])).toHaveLength(1)
  })
})

describe('filterHallucinations', () => {
  const catalogue = [
    { id: 'IND-1', nom: 'Fraude fiscale' },
    { id: 'IND-2', nom: 'Délais de paiement' },
  ]

  it('conserve les candidats présents au catalogue, dans leur ordre de pertinence', () => {
    expect(filterHallucinations(['IND-2', 'IND-1'], catalogue)).toEqual([
      { id: 'IND-2', nom: 'Délais de paiement' },
      { id: 'IND-1', nom: 'Fraude fiscale' },
    ])
  })

  it('écarte un identifiant inventé par le sous-modèle', () => {
    expect(filterHallucinations(['IND-999'], catalogue)).toEqual([])
  })
})
