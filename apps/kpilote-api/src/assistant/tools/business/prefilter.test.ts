import { describe, expect, it } from 'vitest'

import {
  rankByMatchedTerms,
  splitIntoTerms,
  filterHallucinations,
} from '@/assistant/tools/business/prefilter'

describe('splitIntoTerms', () => {
  it('normalise la casse et retire les diacritiques', () => {
    expect(splitIntoTerms('Délais DE Paiement')).toEqual(['delais', 'paiement'])
  })

  it('retire les mots vides et les termes trop courts', () => {
    expect(splitIntoTerms("l'indicateur sur la fraude fiscale")).toEqual(['fraude', 'fiscale'])
  })

  it('dédoublonne', () => {
    expect(splitIntoTerms('fraude fraude fiscale')).toEqual(['fraude', 'fiscale'])
  })

  it('renvoie un tableau vide sur une requête sans terme exploitable', () => {
    expect(splitIntoTerms('et le ?')).toEqual([])
  })
})

describe('rankByMatchedTerms', () => {
  const candidats = [
    { publicId: 'IND-1', nom: 'Recouvrement de la fraude fiscale' },
    { publicId: 'IND-2', nom: 'Fraude aux prestations' },
    { publicId: 'IND-3', nom: 'Délais de paiement' },
  ]

  it('place devant les candidats qui satisfont le plus de termes', () => {
    const classes = rankByMatchedTerms(candidats, ['fraude', 'fiscale'])
    expect(classes.map((candidat) => candidat.publicId)).toEqual(['IND-1', 'IND-2'])
  })

  it('écarte les candidats qui ne satisfont aucun terme', () => {
    const classes = rankByMatchedTerms(candidats, ['paiement'])
    expect(classes.map((candidat) => candidat.publicId)).toEqual(['IND-3'])
  })

  it('est insensible à la casse et aux diacritiques du candidat', () => {
    const classes = rankByMatchedTerms([{ publicId: 'IND-9', nom: 'DÉLAIS' }], ['delais'])
    expect(classes).toHaveLength(1)
  })

  it('dédoublonne sur publicId quand un candidat vient de plusieurs appels', () => {
    const meme = { publicId: 'IND-1', nom: 'Recouvrement de la fraude fiscale' }
    expect(rankByMatchedTerms([meme, meme], ['fraude'])).toHaveLength(1)
  })
})

describe('filterHallucinations', () => {
  const catalogue = [
    { publicId: 'IND-1', nom: 'Fraude fiscale' },
    { publicId: 'IND-2', nom: 'Délais de paiement' },
  ]

  it('conserve les candidats présents au catalogue, dans leur ordre de pertinence', () => {
    expect(
      filterHallucinations([{ id: 'IND-2' }, { id: 'IND-1' }], catalogue, (c) => c.id),
    ).toEqual([
      { publicId: 'IND-2', nom: 'Délais de paiement' },
      { publicId: 'IND-1', nom: 'Fraude fiscale' },
    ])
  })

  it('écarte un identifiant inventé par le sous-modèle', () => {
    expect(filterHallucinations([{ id: 'IND-999' }], catalogue, (c) => c.id)).toEqual([])
  })
})
