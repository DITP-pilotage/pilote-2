import { asSchema } from 'ai'
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

  it('joint un tableau en CSV, la seule forme que les routes de liste acceptent', () => {
    expect(buildUrl('/indicateurs', { ids: ['IND-1', 'IND-2'] })).toBe(
      '/indicateurs?ids=IND-1%2CIND-2',
    )
  })
})

// Rejoue la validation que le SDK applique avant `execute`.
const validated = async (tool: { inputSchema: unknown }, value: unknown): Promise<never> => {
  const result = await asSchema(tool.inputSchema as Parameters<typeof asSchema>[0]).validate!(value)
  if (!result.success) throw result.error
  return result.value as never
}

describe('deriveTool', () => {
  const entry = WHITELIST.find((candidat) => candidat.name === 'get_indicateur')!

  it("expose au modèle le schéma d'ENTRÉE de la route, avant transformation", async () => {
    const valeursEntry = WHITELIST.find((candidat) => candidat.name === 'get_indicateur_valeurs')!
    const tool = deriveTool(valeursEntry, () => Promise.resolve(new Response('{}')))

    const schema = (await asSchema(tool.inputSchema as Parameters<typeof asSchema>[0])
      .jsonSchema) as {
      properties: Record<string, { type?: string }>
    }

    expect(schema.properties.individus?.type).toBe('string')
  })

  it("refuse ce que la route refuserait, même si l'entrée est bien formée en JSON", async () => {
    const valeursEntry = WHITELIST.find((candidat) => candidat.name === 'get_indicateur_valeurs')!
    const tool = deriveTool(valeursEntry, () => Promise.resolve(new Response('{}')))

    await expect(validated(tool, { id: 'IND-046', individus: ['REG-01'] })).rejects.toThrow()
  })

  it('passe par le requêteur injecté, jamais par une app importée', async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ id: 'IND-42' }))))
    const tool = deriveTool(entry, fetcher)

    const output = await tool.execute?.(
      { id: 'IND-42' },
      { toolCallId: 't', messages: [], context: undefined },
    )

    expect(fetcher).toHaveBeenCalledWith('/indicateurs/IND-42')
    expect(output).toEqual({ id: 'IND-42' })
  })

  it('accepte un paramètre optionnel vide comme absent, sans le porter dans la requête', async () => {
    const listEntry = WHITELIST.find((candidat) => candidat.name === 'get_indicateurs')!
    const fetcher = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ items: [] }))))
    const tool = deriveTool(listEntry, fetcher)

    const input = await validated(tool, { cursor: '', recherche: '', pageSize: 100 })
    await tool.execute?.(input, { toolCallId: 't', messages: [], context: undefined })

    expect(fetcher).toHaveBeenCalledWith('/indicateurs?pageSize=100')
  })

  it("rejoue une liste CSV telle que la route l'attend, même après transformation du schéma", async () => {
    const valeursEntry = WHITELIST.find((candidat) => candidat.name === 'get_indicateur_valeurs')!
    const fetcher = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ items: [] }))))
    const tool = deriveTool(valeursEntry, fetcher)

    const input = await validated(tool, { id: 'IND-046', individus: 'REG-01,REG-02' })
    await tool.execute?.(input, { toolCallId: 't', messages: [], context: undefined })

    expect(fetcher).toHaveBeenCalledWith('/indicateurs/IND-046/valeurs?individus=REG-01%2CREG-02')
  })

  it("remonte le message de l'API pour que le modèle sache quoi corriger", async () => {
    const body = JSON.stringify({ code: 'VALIDATION_ERROR', message: 'individus est requis' })
    const fetcher = vi.fn(() => Promise.resolve(new Response(body, { status: 400 })))
    const tool = deriveTool(entry, fetcher)

    const output = await tool.execute?.(
      { id: 'IND-42' },
      { toolCallId: 't', messages: [], context: undefined },
    )

    expect(output).toContainEntry(['error', expect.stringContaining('individus est requis')])
  })

  it("refuse de rejouer un appel déjà échoué à l'identique dans le tour", async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response('nope', { status: 400 })))
    const tool = deriveTool(entry, fetcher)
    const options = { toolCallId: 't', messages: [], context: undefined }

    await tool.execute?.({ id: 'IND-42' }, options)
    const second = await tool.execute?.({ id: 'IND-42' }, options)

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(second).toContainEntry(['error', expect.stringContaining('déjà échoué')])
  })

  it('renvoie une erreur lisible plutôt que de faire tomber le tour', async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response('nope', { status: 403 })))
    const tool = deriveTool(entry, fetcher)

    const output = await tool.execute?.(
      { id: 'IND-42' },
      { toolCallId: 't', messages: [], context: undefined },
    )

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
