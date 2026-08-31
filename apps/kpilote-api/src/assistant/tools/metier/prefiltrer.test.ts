import { describe, expect, it } from 'vitest'

import {
  classerParTermesSatisfaits,
  decouperEnTermes,
  filtrerHallucinations,
} from '@/assistant/tools/metier/prefiltrer'

describe('decouperEnTermes', () => {
  it('normalise la casse et retire les diacritiques', () => {
    expect(decouperEnTermes('Délais DE Paiement')).toEqual(['delais', 'paiement'])
  })

  it('retire les mots vides et les termes trop courts', () => {
    expect(decouperEnTermes("l'indicateur sur la fraude fiscale")).toEqual(['fraude', 'fiscale'])
  })

  it('dédoublonne', () => {
    expect(decouperEnTermes('fraude fraude fiscale')).toEqual(['fraude', 'fiscale'])
  })

  it('renvoie un tableau vide sur une requête sans terme exploitable', () => {
    expect(decouperEnTermes('et le ?')).toEqual([])
  })
})

describe('classerParTermesSatisfaits', () => {
  const candidats = [
    { publicId: 'IND-1', nom: 'Recouvrement de la fraude fiscale' },
    { publicId: 'IND-2', nom: 'Fraude aux prestations' },
    { publicId: 'IND-3', nom: 'Délais de paiement' },
  ]

  it('place devant les candidats qui satisfont le plus de termes', () => {
    const classes = classerParTermesSatisfaits(candidats, ['fraude', 'fiscale'])
    expect(classes.map((candidat) => candidat.publicId)).toEqual(['IND-1', 'IND-2'])
  })

  it('écarte les candidats qui ne satisfont aucun terme', () => {
    const classes = classerParTermesSatisfaits(candidats, ['paiement'])
    expect(classes.map((candidat) => candidat.publicId)).toEqual(['IND-3'])
  })

  it('est insensible à la casse et aux diacritiques du candidat', () => {
    const classes = classerParTermesSatisfaits([{ publicId: 'IND-9', nom: 'DÉLAIS' }], ['delais'])
    expect(classes).toHaveLength(1)
  })

  it('dédoublonne sur publicId quand un candidat vient de plusieurs appels', () => {
    const meme = { publicId: 'IND-1', nom: 'Recouvrement de la fraude fiscale' }
    expect(classerParTermesSatisfaits([meme, meme], ['fraude'])).toHaveLength(1)
  })
})

describe('filtrerHallucinations', () => {
  const catalogue = [
    { publicId: 'IND-1', nom: 'Fraude fiscale' },
    { publicId: 'IND-2', nom: 'Délais de paiement' },
  ]

  it('conserve les candidats présents au catalogue, dans leur ordre de pertinence', () => {
    expect(
      filtrerHallucinations([{ id: 'IND-2' }, { id: 'IND-1' }], catalogue, (c) => c.id),
    ).toEqual([
      { publicId: 'IND-2', nom: 'Délais de paiement' },
      { publicId: 'IND-1', nom: 'Fraude fiscale' },
    ])
  })

  it('écarte un identifiant inventé par le sous-modèle', () => {
    expect(filtrerHallucinations([{ id: 'IND-999' }], catalogue, (c) => c.id)).toEqual([])
  })
})
