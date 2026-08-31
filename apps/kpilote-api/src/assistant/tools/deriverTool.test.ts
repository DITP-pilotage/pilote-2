import { describe, expect, it, vi } from 'vitest'

import { construireUrl, deriverTool } from '@/assistant/tools/deriverTool'
import { WHITELIST } from '@/assistant/tools/whitelist'

describe('construireUrl', () => {
  it('substitue les paramètres de chemin', () => {
    expect(construireUrl('/indicateurs/{id}', { id: 'IND-42' })).toBe('/indicateurs/IND-42')
  })

  it('reporte les paramètres restants en query string', () => {
    expect(construireUrl('/indicateurs', { recherche: 'fraude', pageSize: 20 })).toBe(
      '/indicateurs?recherche=fraude&pageSize=20',
    )
  })

  it('combine chemin et query', () => {
    expect(construireUrl('/indicateurs/{id}/valeurs', { id: 'IND-7', pageSize: 5 })).toBe(
      '/indicateurs/IND-7/valeurs?pageSize=5',
    )
  })

  it('encode les valeurs de chemin', () => {
    expect(construireUrl('/referentiels/{id}/individus', { id: 'REF-A B' })).toBe(
      '/referentiels/REF-A%20B/individus',
    )
  })

  it('ignore les paramètres non renseignés', () => {
    expect(construireUrl('/indicateurs', { recherche: undefined })).toBe('/indicateurs')
  })

  it('déplie un paramètre tableau en occurrences répétées', () => {
    expect(construireUrl('/indicateurs', { ids: ['IND-1', 'IND-2'] })).toBe(
      '/indicateurs?ids=IND-1&ids=IND-2',
    )
  })
})

describe('deriverTool', () => {
  const entree = WHITELIST.find((candidat) => candidat.nom === 'get_indicateur')!

  it('passe par le requêteur injecté, jamais par une app importée', async () => {
    const requeteur = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ id: 'IND-42' }))))
    const outil = deriverTool(entree, requeteur)

    const sortie = await outil.execute?.({ id: 'IND-42' }, { toolCallId: 't', messages: [] })

    expect(requeteur).toHaveBeenCalledWith('/indicateurs/IND-42')
    expect(sortie).toEqual({ id: 'IND-42' })
  })

  it('renvoie une erreur lisible plutôt que de faire tomber le tour', async () => {
    const requeteur = vi.fn(() => Promise.resolve(new Response('nope', { status: 403 })))
    const outil = deriverTool(entree, requeteur)

    const sortie = await outil.execute?.({ id: 'IND-42' }, { toolCallId: 't', messages: [] })

    expect(sortie).toEqual({ erreur: expect.stringContaining('403') })
  })

  it('reprend la description de la route, que le modèle lit au moment de décider', () => {
    const outil = deriverTool(entree, () => Promise.resolve(new Response('{}')))
    expect(outil.description).toBe(entree.route.description)
  })
})

describe('WHITELIST', () => {
  it('expose huit entrées aux noms uniques', () => {
    const noms = WHITELIST.map((entreeCourante) => entreeCourante.nom)
    expect(noms).toHaveLength(8)
    expect(new Set(noms).size).toBe(8)
  })

  it('ne référence que des routes de lecture', () => {
    expect(WHITELIST.every((entreeCourante) => entreeCourante.route.method === 'get')).toBe(true)
  })

  it('porte une description substantielle sur chaque route, lue par le modèle', () => {
    expect(
      WHITELIST.every((entreeCourante) => (entreeCourante.route.description ?? '').length > 40),
    ).toBe(true)
  })
})
