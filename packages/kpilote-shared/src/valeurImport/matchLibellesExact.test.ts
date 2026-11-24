import { describe, expect, it } from 'vitest'

import { matchLibellesExact } from './matchLibellesExact'

const candidats = [
  { id: 'DEPT-13', nom: 'Bouches-du-Rhône' },
  { id: 'DEPT-84', nom: 'Vaucluse' },
  { id: 'COM-93066', nom: 'Saint-Denis' },
  { id: 'COM-97411', nom: 'Saint-Denis' },
]

describe('matchLibellesExact', () => {
  it('rapproche un libellé par l’identifiant public du candidat', () => {
    expect(matchLibellesExact({ libelles: ['DEPT-84'], candidats })).toEqual({
      rapprochements: { 'DEPT-84': { statut: 'RESOLU', publicId: 'DEPT-84', par: 'EXACT' } },
      restants: [],
    })
  })

  it('rapproche un libellé par le nom, sans tenir compte des accents ni de la casse', () => {
    expect(matchLibellesExact({ libelles: ['bouches du rhone'], candidats })).toEqual({
      rapprochements: {
        'bouches du rhone': { statut: 'RESOLU', publicId: 'DEPT-13', par: 'EXACT' },
      },
      restants: [],
    })
  })

  it('laisse à rapprocher un nom porté par deux candidats', () => {
    expect(matchLibellesExact({ libelles: ['Saint-Denis'], candidats })).toEqual({
      rapprochements: {},
      restants: ['Saint-Denis'],
    })
  })

  it('laisse à rapprocher un libellé inconnu', () => {
    expect(matchLibellesExact({ libelles: ['Atlantide'], candidats })).toEqual({
      rapprochements: {},
      restants: ['Atlantide'],
    })
  })
})
