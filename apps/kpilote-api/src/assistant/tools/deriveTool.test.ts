import { describe, expect, it, vi } from 'vitest'

import { buildUrl, deriveTool, type WhitelistEntry } from '@/assistant/tools/deriveTool'
import { WHITELIST } from '@/assistant/tools/whitelist'

describe('buildUrl', () => {
  it('substitue les paramètres de chemin', () => {
    expect(buildUrl('/indicateurs/{id}', { id: 'IND-42' })).toBe('/indicateurs/IND-42')
  })

  it('reporte les paramètres restants en query string', () => {
    expect(buildUrl('/indicateurs', { recherche: 'fraude', pageSize: 20 })).toBe(
      '/indicateurs?recherche=fraude&pageSize=20',
    )
  })

  it('combine chemin et query', () => {
    expect(buildUrl('/indicateurs/{id}/valeurs', { id: 'IND-7', pageSize: 5 })).toBe(
      '/indicateurs/IND-7/valeurs?pageSize=5',
    )
  })

  it('encode les valeurs de chemin', () => {
    expect(buildUrl('/referentiels/{id}/individus', { id: 'REF-A B' })).toBe(
      '/referentiels/REF-A%20B/individus',
    )
  })

  it('ignore les paramètres non renseignés', () => {
    expect(buildUrl('/indicateurs', { recherche: undefined })).toBe('/indicateurs')
  })

  it('déplie un paramètre tableau en occurrences répétées', () => {
    expect(buildUrl('/indicateurs', { ids: ['IND-1', 'IND-2'] })).toBe(
      '/indicateurs?ids=IND-1&ids=IND-2',
    )
  })
})

describe('deriveTool', () => {
  const entry = WHITELIST.find((candidat) => candidat.name === 'get_indicateur')!

  it('passe par le requêteur injecté, jamais par une app importée', async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ id: 'IND-42' }))))
    const tool = deriveTool(entry, fetcher)

    const output = await tool.execute?.({ id: 'IND-42' }, { toolCallId: 't', messages: [] })

    expect(fetcher).toHaveBeenCalledWith('/indicateurs/IND-42')
    expect(output).toEqual({ id: 'IND-42' })
  })

  it('renvoie une erreur lisible plutôt que de faire tomber le tour', async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response('nope', { status: 403 })))
    const tool = deriveTool(entry, fetcher)

    const output = await tool.execute?.({ id: 'IND-42' }, { toolCallId: 't', messages: [] })

    expect(output).toContainEntry(['error', expect.stringContaining('403')])
  })

  it('reprend la description de la route, que le modèle lit au moment de décider', () => {
    const tool = deriveTool(entry, () => Promise.resolve(new Response('{}')))
    expect(tool.description).toBe(entry.route.description)
  })
})

describe('WHITELIST', () => {
  it('expose huit entrées aux names uniques', () => {
    const names = WHITELIST.map((entry) => entry.name)
    expect(names).toHaveLength(8)
    expect(names).toBeArrayOfSize(8)
    expect(new Set(names).size).toBe(8)
  })

  it('ne référence que des routes de lecture', () => {
    expect(WHITELIST).toSatisfyAll((entry: WhitelistEntry) => entry.route.method === 'get')
  })

  it('porte une description substantielle sur chaque route, lue par le modèle', () => {
    expect(WHITELIST.every((entry) => (entry.route.description ?? '').length > 40)).toBe(true)
  })
})
