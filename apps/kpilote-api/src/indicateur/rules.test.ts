import { describe, expect, it } from 'vitest'

import { checkAxesModifiables } from '@/indicateur/rules'

describe.concurrent('checkAxesModifiables', () => {
  it('accepte un changement d’ordre des mêmes axes, même avec des valeurs', () => {
    const result = checkAxesModifiables({
      axeIdsActuels: ['a', 'b'],
      axeIdsCibles: ['b', 'a'],
      nombreValeurs: 12,
    })
    expect(result.isOk()).toBe(true)
  })

  it('accepte d’ajouter un axe à un indicateur sans valeur', () => {
    const result = checkAxesModifiables({
      axeIdsActuels: ['a'],
      axeIdsCibles: ['a', 'b'],
      nombreValeurs: 0,
    })
    expect(result.isOk()).toBe(true)
  })

  it('rejette l’ajout d’un axe à un indicateur qui a des valeurs', () => {
    const result = checkAxesModifiables({
      axeIdsActuels: ['a'],
      axeIdsCibles: ['a', 'b'],
      nombreValeurs: 12,
    })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'AXES_VERROUILLES', nombreValeurs: 12 })
  })

  it('rejette le retrait d’un axe d’un indicateur qui a des valeurs', () => {
    const result = checkAxesModifiables({
      axeIdsActuels: ['a', 'b'],
      axeIdsCibles: ['a'],
      nombreValeurs: 1,
    })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'AXES_VERROUILLES', nombreValeurs: 1 })
  })
})
