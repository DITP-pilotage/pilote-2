import { type EntiteTrouvee } from '@pilote/kpilote-shared/assistant/tools'
import { describe, expect, it, vi } from 'vitest'

import { rechercherEntites } from '@/assistant/tools/metier/searchIndicateurs'

const catalogue: EntiteTrouvee[] = [
  { publicId: 'IND-1', nom: 'Recouvrement de la fraude fiscale' },
  { publicId: 'IND-2', nom: 'Délais de paiement' },
  { publicId: 'IND-3', nom: 'Violences sexistes et sexuelles' },
]

const filtrerParTerme = (terme: string) =>
  Promise.resolve(catalogue.filter((entite) => entite.nom.toLowerCase().includes(terme)))

const chargerCatalogue = () => Promise.resolve(catalogue)

describe('rechercherEntites', () => {
  it('renvoie directement le candidat unique, sans appeler le modèle', async () => {
    const classer = vi.fn()
    const sortie = await rechercherEntites({
      requete: 'délais de paiement',
      filtrerParTerme,
      chargerCatalogue,
      classer,
    })

    expect(sortie.resultats).toEqual([{ publicId: 'IND-2', nom: 'Délais de paiement' }])
    expect(sortie.repli).toBe(false)
    expect(classer).not.toHaveBeenCalled()
  })

  it('fait classer par le modèle quand plusieurs candidats subsistent', async () => {
    const classer = vi.fn(() => Promise.resolve([{ id: 'IND-1' }]))
    const sortie = await rechercherEntites({
      requete: 'fraude fiscale paiement',
      filtrerParTerme,
      chargerCatalogue,
      classer,
    })

    expect(classer).toHaveBeenCalledOnce()
    expect(sortie.resultats.map((entite) => entite.publicId)).toEqual(['IND-1'])
  })

  it('retombe sur le catalogue complet quand le pré-filtre ne trouve rien — cas des acronymes', async () => {
    const classer = vi.fn(() => Promise.resolve([{ id: 'IND-3' }]))
    const sortie = await rechercherEntites({
      requete: 'sigle vss',
      filtrerParTerme,
      chargerCatalogue,
      classer,
    })

    expect(sortie.repli).toBe(true)
    expect(sortie.resultats.map((entite) => entite.publicId)).toEqual(['IND-3'])
  })

  it('refuse le repli plutôt que de tronquer un catalogue trop large', async () => {
    const gros = Array.from({ length: 400 }, (_, index) => ({
      publicId: `IND-${index}`,
      nom: `Indicateur ${index}`,
    }))
    const classer = vi.fn()
    const sortie = await rechercherEntites({
      requete: 'zzz',
      filtrerParTerme: () => Promise.resolve([]),
      chargerCatalogue: () => Promise.resolve(gros),
      classer,
    })

    expect(sortie.resultats).toEqual([])
    expect(sortie.raison).toContain('trop large')
    expect(classer).not.toHaveBeenCalled()
  })

  it('écarte un identifiant que le modèle a inventé', async () => {
    const classer = vi.fn(() => Promise.resolve([{ id: 'IND-999' }, { id: 'IND-1' }]))
    const sortie = await rechercherEntites({
      requete: 'fraude fiscale paiement',
      filtrerParTerme,
      chargerCatalogue,
      classer,
    })

    expect(sortie.resultats.map((entite) => entite.publicId)).toEqual(['IND-1'])
  })

  it('renvoie vide avec une raison quand la requête n’a aucun terme exploitable', async () => {
    const classer = vi.fn(() => Promise.resolve([]))
    const sortie = await rechercherEntites({
      requete: 'et le ?',
      filtrerParTerme,
      chargerCatalogue: () => Promise.resolve([]),
      classer,
    })

    expect(sortie.resultats).toEqual([])
    expect(sortie.raison).toBeDefined()
    expect(classer).not.toHaveBeenCalled()
  })
})
