import { type FoundEntite } from '@pilote/kpilote-shared/assistant/tools'
import { describe, expect, it, vi } from 'vitest'

import { searchEntites } from '@/assistant/tools/business/searchIndicateurs'

const catalog: FoundEntite[] = [
  { publicId: 'IND-1', nom: 'Recouvrement de la fraude fiscale' },
  { publicId: 'IND-2', nom: 'Délais de paiement' },
  { publicId: 'IND-3', nom: 'Violences sexistes et sexuelles' },
]

const filterByTerm = (term: string) =>
  Promise.resolve(catalog.filter((entite) => entite.nom.toLowerCase().includes(term)))

const loadCatalog = () => Promise.resolve(catalog)

describe('searchEntites', () => {
  it('renvoie directement le candidat unique, sans appeler le modèle', async () => {
    const rank = vi.fn()
    const output = await searchEntites({
      query: 'délais de paiement',
      filterByTerm,
      loadCatalog,
      rank,
    })

    expect(output.results).toIncludeAllPartialMembers([{ publicId: 'IND-2' }])
    expect(output.fallback).toBeFalse()
    expect(rank).not.toHaveBeenCalled()
  })

  it('fait classer par le modèle quand plusieurs candidats subsistent', async () => {
    const rank = vi.fn(() => Promise.resolve([{ id: 'IND-1' }]))
    const output = await searchEntites({
      query: 'fraude fiscale paiement',
      filterByTerm,
      loadCatalog,
      rank,
    })

    expect(rank).toHaveBeenCalledOnce()
    expect(output.results.map((entite) => entite.publicId)).toEqual(['IND-1'])
  })

  it('retombe sur le catalog complet quand le pré-filtre ne trouve rien — cas des acronymes', async () => {
    const rank = vi.fn(() => Promise.resolve([{ id: 'IND-3' }]))
    const output = await searchEntites({
      query: 'sigle vss',
      filterByTerm,
      loadCatalog,
      rank,
    })

    expect(output.fallback).toBeTrue()
    expect(output.results.map((entite) => entite.publicId)).toEqual(['IND-3'])
  })

  it('refuse le repli plutôt que de tronquer un catalog trop large', async () => {
    const grosCatalog = Array.from({ length: 400 }, (_, index) => ({
      publicId: `IND-${index}`,
      nom: `Indicateur ${index}`,
    }))
    const rank = vi.fn()
    const output = await searchEntites({
      query: 'zzz',
      filterByTerm: () => Promise.resolve([]),
      loadCatalog: () => Promise.resolve(grosCatalog),
      rank,
    })

    expect(output.results).toBeEmpty()
    expect(output.reason).toInclude('trop large')
    expect(rank).not.toHaveBeenCalled()
  })

  it('écarte un identifiant que le modèle a inventé', async () => {
    const rank = vi.fn(() => Promise.resolve([{ id: 'IND-999' }, { id: 'IND-1' }]))
    const output = await searchEntites({
      query: 'fraude fiscale paiement',
      filterByTerm,
      loadCatalog,
      rank,
    })

    expect(output.results.map((entite) => entite.publicId)).toEqual(['IND-1'])
  })

  it('renvoie vide avec une raison quand la requête n’a aucun terme exploitable', async () => {
    const rank = vi.fn(() => Promise.resolve([]))
    const output = await searchEntites({
      query: 'et le ?',
      filterByTerm,
      loadCatalog: () => Promise.resolve([]),
      rank,
    })

    expect(output.results).toBeEmpty()
    expect(output.reason).toBeString()
    expect(rank).not.toHaveBeenCalled()
  })
})
