import { describe, expect, it } from 'vitest'

import { checkSansDoublon } from '@/permission/rules'

describe.concurrent('checkSansDoublon', () => {
  it('accepte des ressources distinctes', () => {
    expect(checkSansDoublon({ ressource: 'indicateur', publicIds: ['A', 'B'] }).isOk()).toBe(true)
  })

  it('rejette une ressource citée deux fois', () => {
    const result = checkSansDoublon({ ressource: 'collection', publicIds: ['A', 'B', 'A'] })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'DOUBLONS', ressource: 'collection' })
  })
})
