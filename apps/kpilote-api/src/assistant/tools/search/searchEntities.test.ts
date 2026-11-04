import { type NamedEntity } from '@pilote/kpilote-shared/assistant/tools'
import { describe, expect, it } from 'vitest'

import { searchEntities, type Ranker } from '@/assistant/tools/search/searchEntities'

const catalog = (size: number): NamedEntity[] =>
  Array.from({ length: size }, (_, index) => ({ id: `IND-${index}`, nom: `Indicateur ${index}` }))

const rankerReturning = (ids: string[]) => {
  const calls: string[] = []
  const rank: Ranker = (query) => {
    calls.push(query)
    return Promise.resolve(ids)
  }
  return { rank, calls }
}

describe('searchEntities', () => {
  it("n'appelle pas le modèle quand un seul candidat ressort", async () => {
    const { rank, calls } = rankerReturning([])
    const output = await searchEntities({
      query: 'fraude fiscale',
      filterByTerm: () => Promise.resolve([{ id: 'IND-1', nom: 'Fraude fiscale' }]),
      loadCatalog: () => Promise.resolve({ items: [], total: 0 }),
      rank,
    })

    expect(output).toEqual({ results: [{ id: 'IND-1', nom: 'Fraude fiscale' }] })
    expect(calls).toEqual([])
  })

  it('demande une précision quand le catalogue dépasse 300 entrées sans match lexical', async () => {
    const { rank } = rankerReturning([])
    const output = await searchEntities({
      query: 'zzz',
      filterByTerm: () => Promise.resolve([]),
      loadCatalog: () => Promise.resolve({ items: catalog(300), total: 301 }),
      rank,
    })

    expect(output).toEqual({ results: [], needsClarification: expect.stringContaining('301') })
  })

  it('se replie sur le catalogue entier quand il reste sous la borne', async () => {
    const { rank, calls } = rankerReturning(['IND-2'])
    const output = await searchEntities({
      query: 'VSS',
      filterByTerm: () => Promise.resolve([]),
      loadCatalog: () => Promise.resolve({ items: catalog(5), total: 5 }),
      rank,
    })

    expect(output).toEqual({ results: [{ id: 'IND-2', nom: 'Indicateur 2' }] })
    expect(calls).toEqual(['VSS'])
  })

  it('écarte un identifiant inventé par le classement', async () => {
    const { rank } = rankerReturning(['IND-404', 'IND-1'])
    const output = await searchEntities({
      query: 'fraude',
      filterByTerm: () =>
        Promise.resolve([
          { id: 'IND-1', nom: 'Fraude fiscale' },
          { id: 'IND-2', nom: 'Fraude sociale' },
        ]),
      loadCatalog: () => Promise.resolve({ items: [], total: 0 }),
      rank,
    })

    expect(output.results).toEqual([{ id: 'IND-1', nom: 'Fraude fiscale' }])
  })

  it("dit qu'aucune entité n'est accessible plutôt que de rendre une liste vide muette", async () => {
    const { rank } = rankerReturning([])
    const output = await searchEntities({
      query: 'fraude',
      filterByTerm: () => Promise.resolve([]),
      loadCatalog: () => Promise.resolve({ items: [], total: 0 }),
      rank,
    })

    expect(output).toEqual({ results: [], needsClarification: expect.any(String) })
  })
})
