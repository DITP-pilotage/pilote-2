import { describe, expect, it } from 'vitest'

import { checkPasAutoParent, checkSansCycle } from '@/relation/rules'

describe.concurrent('checkPasAutoParent', () => {
  it('accepte un parent distinct de l’enfant', () => {
    expect(checkPasAutoParent({ enfantPublicId: 'DEPT-84', parentPublicId: 'REG-93' }).isOk()).toBe(
      true,
    )
  })

  it('rejette un individu parent de lui-même', () => {
    const result = checkPasAutoParent({ enfantPublicId: 'DEPT-84', parentPublicId: 'DEPT-84' })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'AUTO_PARENT' })
  })
})

describe.concurrent('checkSansCycle', () => {
  it('accepte un parent qui ne descend pas de l’enfant', () => {
    expect(checkSansCycle({ enfantId: 'e', cheminDuParent: ['p', 'racine'] }).isOk()).toBe(true)
  })

  it('rejette un parent qui descend de l’enfant', () => {
    const result = checkSansCycle({ enfantId: 'e', cheminDuParent: ['p', 'e', 'racine'] })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'CYCLE_DETECTE' })
  })
})
