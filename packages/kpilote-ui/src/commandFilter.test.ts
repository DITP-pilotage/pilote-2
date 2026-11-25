import { describe, expect, it } from 'vitest'

import { commandFilter } from './commandFilter'

describe('commandFilter', () => {
  it('garde un élément qui contient la recherche, sans tenir compte de la casse ni des accents', () => {
    expect(commandFilter('Île-de-France IDF', 'ile-de')).toBe(1)
    expect(commandFilter('Corse-du-Sud', 'CORSE')).toBe(1)
  })

  it('écarte un élément qui ne contient pas la recherche', () => {
    expect(commandFilter('Haute-Corse', 'sud')).toBe(0)
  })

  it('garde tout pour une recherche vide', () => {
    expect(commandFilter('Ain', '  ')).toBe(1)
  })
})
