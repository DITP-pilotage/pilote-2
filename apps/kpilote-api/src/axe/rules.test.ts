import { describe, expect, it } from 'vitest'

import { checkNiveauxSupprimables, checkNombreNiveauxModifiable } from '@/axe/rules'

describe.concurrent('checkNombreNiveauxModifiable', () => {
  it('accepte un axe qui n’existe pas encore', () => {
    const result = checkNombreNiveauxModifiable({
      nombreNiveauxActuel: null,
      nombreNiveauxCible: 3,
      indicateursDeclarants: [],
    })
    expect(result.isOk()).toBe(true)
  })

  it('accepte un renommage, même si des indicateurs déclarent l’axe', () => {
    const result = checkNombreNiveauxModifiable({
      nombreNiveauxActuel: 2,
      nombreNiveauxCible: 2,
      indicateursDeclarants: ['IND-1'],
    })
    expect(result.isOk()).toBe(true)
  })

  it('accepte un changement de nombre de niveaux sur un axe que personne ne déclare', () => {
    const result = checkNombreNiveauxModifiable({
      nombreNiveauxActuel: 2,
      nombreNiveauxCible: 3,
      indicateursDeclarants: [],
    })
    expect(result.isOk()).toBe(true)
  })

  it('rejette un changement de nombre de niveaux sur un axe déclaré, en listant les indicateurs', () => {
    const result = checkNombreNiveauxModifiable({
      nombreNiveauxActuel: 2,
      nombreNiveauxCible: 1,
      indicateursDeclarants: ['IND-1', 'IND-2'],
    })
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'AXE_UTILISE',
      indicateurs: ['IND-1', 'IND-2'],
    })
  })
})

describe.concurrent('checkNiveauxSupprimables', () => {
  it('accepte de retirer des niveaux qui ne portent aucune modalité', () => {
    const result = checkNiveauxSupprimables({
      nombreNiveauxCible: 1,
      ordresPorteursDeModalites: [1],
    })
    expect(result.isOk()).toBe(true)
  })

  it('rejette le retrait de niveaux qui portent des modalités, en listant leurs ordres', () => {
    const result = checkNiveauxSupprimables({
      nombreNiveauxCible: 1,
      ordresPorteursDeModalites: [1, 2, 3],
    })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'NIVEAU_PORTE_MODALITES', ordres: [2, 3] })
  })
})
