import { TILE_TYPES } from '@pilote/kpilote-shared/assistant/tiles'
import { describe, expect, it } from 'vitest'

import { TILE_REGISTRY } from './registry'

describe('TILE_REGISTRY', () => {
  it('couvre exactement le catalogue partagé', () => {
    expect(Object.keys(TILE_REGISTRY).sort()).toEqual([...TILE_TYPES].sort())
  })

  it('associe un composant à chaque tuile', () => {
    expect(Object.values(TILE_REGISTRY).every((render) => typeof render === 'function')).toBe(true)
  })
})
