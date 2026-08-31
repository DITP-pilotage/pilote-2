import { TYPES_VIGNETTE } from '@pilote/kpilote-shared/assistant/vignettes'
import { describe, expect, it } from 'vitest'

import { REGISTRE_VIGNETTES } from './registre'

describe('REGISTRE_VIGNETTES', () => {
  it('couvre exactement le catalogue partagé', () => {
    expect(Object.keys(REGISTRE_VIGNETTES).sort()).toEqual([...TYPES_VIGNETTE].sort())
  })

  it('associe un composant à chaque vignette', () => {
    expect(Object.values(REGISTRE_VIGNETTES).every((rendu) => typeof rendu === 'function')).toBe(
      true,
    )
  })
})
