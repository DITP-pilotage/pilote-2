import { describe, expect, it } from 'vitest'

import { parseIndividusParam, serializeIndividusParam } from './selection'

describe('parseIndividusParam', () => {
  it('parse les paires référentiel racine → individu', () => {
    const map = parseIndividusParam('REF-FR:DEPT-84,REF-BV:BV-12')

    expect(map.get('REF-FR')).toBe('DEPT-84')
    expect(map.get('REF-BV')).toBe('BV-12')
    expect(map.size).toBe(2)
  })

  it('renvoie une map vide sans valeur', () => {
    expect(parseIndividusParam(undefined).size).toBe(0)
    expect(parseIndividusParam('').size).toBe(0)
  })

  it('ignore les entrées malformées', () => {
    const map = parseIndividusParam('bidon,REF-FR:DEPT-84,:,REF-X:')

    expect([...map.entries()]).toEqual([['REF-FR', 'DEPT-84']])
  })
})

describe('serializeIndividusParam', () => {
  it('sérialise une map non vide', () => {
    const map = new Map([
      ['REF-FR', 'DEPT-84'],
      ['REF-BV', 'BV-12'],
    ])

    expect(serializeIndividusParam(map)).toBe('REF-FR:DEPT-84,REF-BV:BV-12')
  })

  it('renvoie undefined pour une map vide', () => {
    expect(serializeIndividusParam(new Map())).toBeUndefined()
  })

  it('fait un aller-retour stable avec parseIndividusParam', () => {
    const map = new Map([['REF-FR', 'DEPT-84']])

    expect(parseIndividusParam(serializeIndividusParam(map))).toEqual(map)
  })
})
