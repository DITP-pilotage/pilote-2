import { type FoundEntite } from '@pilote/kpilote-shared/assistant/tools'
import { describe, expect, it, vi } from 'vitest'

import { searchEntites } from '@/assistant/tools/business/searchIndicateurs'

const catalogue: FoundEntite[] = [
  { publicId: 'IND-1', nom: 'Recouvrement de la fraude fiscale' },
  { publicId: 'IND-2', nom: 'Délais de paiement' },
  { publicId: 'IND-3', nom: 'Violences sexistes et sexuelles' },
]

const filterByTerm = (terme: string) =>
  Promise.resolve(catalogue.filter((entite) => entite.nom.toLowerCase().includes(terme)))

const loadCatalog = () => Promise.resolve(catalogue)

describe('searchEntites', () => {
  it('renvoie directement le candidat unique, sans appeler le modèle', async () => {
    const rank = vi.fn()
    const sortie = await searchEntites({
      query: 'délais de paiement',
      filterByTerm,
      loadCatalog,
      rank,
    })

    expect(sortie.results).toEqual([{ publicId: 'IND-2', nom: 'Délais de paiement' }])
    expect(sortie.fallback).toBe(false)
    expect(rank).not.toHaveBeenCalled()
  })

  it('fait rank par le modèle quand plusieurs candidats subsistent', async () => {
    const rank = vi.fn(() => Promise.resolve([{ id: 'IND-1' }]))
    const sortie = await searchEntites({
      query: 'fraude fiscale paiement',
      filterByTerm,
      loadCatalog,
      rank,
    })

    expect(rank).toHaveBeenCalledOnce()
    expect(sortie.results.map((entite) => entite.publicId)).toEqual(['IND-1'])
  })

  it('retombe sur le catalogue complet quand le pré-filtre ne trouve rien — cas des acronymes', async () => {
    const rank = vi.fn(() => Promise.resolve([{ id: 'IND-3' }]))
    const sortie = await searchEntites({
      query: 'sigle vss',
      filterByTerm,
      loadCatalog,
      rank,
    })

    expect(sortie.fallback).toBe(true)
    expect(sortie.results.map((entite) => entite.publicId)).toEqual(['IND-3'])
  })

  it('refuse le fallback plutôt que de tronquer un catalogue trop large', async () => {
    const gros = Array.from({ length: 400 }, (_, index) => ({
      publicId: `IND-${index}`,
      nom: `Indicateur ${index}`,
    }))
    const rank = vi.fn()
    const sortie = await searchEntites({
      query: 'zzz',
      filterByTerm: () => Promise.resolve([]),
      loadCatalog: () => Promise.resolve(gros),
      rank,
    })

    expect(sortie.results).toEqual([])
    expect(sortie.reason).toContain('trop large')
    expect(rank).not.toHaveBeenCalled()
  })

  it('écarte un identifiant que le modèle a inventé', async () => {
    const rank = vi.fn(() => Promise.resolve([{ id: 'IND-999' }, { id: 'IND-1' }]))
    const sortie = await searchEntites({
      query: 'fraude fiscale paiement',
      filterByTerm,
      loadCatalog,
      rank,
    })

    expect(sortie.results.map((entite) => entite.publicId)).toEqual(['IND-1'])
  })

  it('renvoie vide avec une reason quand la requête n’a aucun terme exploitable', async () => {
    const rank = vi.fn(() => Promise.resolve([]))
    const sortie = await searchEntites({
      query: 'et le ?',
      filterByTerm,
      loadCatalog: () => Promise.resolve([]),
      rank,
    })

    expect(sortie.results).toEqual([])
    expect(sortie.reason).toBeDefined()
    expect(rank).not.toHaveBeenCalled()
  })
})
