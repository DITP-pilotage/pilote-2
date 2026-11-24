import { type EtapePlan, type TableauSource } from '@pilote/kpilote-shared/valeurImport'
import { describe, expect, it } from 'vitest'

import { buildEtapesAttente, progressionOf } from '@/components/import-valeurs/etapesAttente'

const tableau: TableauSource = {
  entetes: ['Département', 'Opérateur', '2022', '2023'],
  lignes: [
    ['Ain', 'Orange', 1, 2],
    ['Aisne', 'SFR', 3, 4],
  ],
}
const cibles = { axes: [{ id: 'AXE-OPERATEUR', nom: 'Opérateur', modalites: [] }] }

const statuts = (etapes: ReadonlyArray<EtapePlan>) =>
  buildEtapesAttente({ tableau, cibles, etapes }).map((etape) => [etape.label, etape.statut])

describe('buildEtapesAttente', () => {
  it('lit le fichier puis attend la structure tant que le serveur n’a rien diffusé', () => {
    expect(statuts([])).toEqual([
      ['Lecture du fichier', 'TERMINEE'],
      ['Structure du tableau', 'EN_COURS'],
      ['Individus', 'A_VENIR'],
      ['Opérateur', 'A_VENIR'],
      ['Préparation du tableau', 'A_VENIR'],
    ])
  })

  it('décrit le fichier lu et la structure trouvée', () => {
    const etapes = buildEtapesAttente({
      tableau,
      cibles,
      etapes: [
        { etape: 'STRUCTURE', statut: 'EN_COURS' },
        {
          etape: 'STRUCTURE',
          statut: 'TERMINEE',
          valeurs: {
            disposition: 'COLONNES',
            colonnes: [
              { colonne: '2022', date: '2022-01-01' },
              { colonne: '2023', date: '2023-01-01' },
            ],
          },
        },
        { etape: 'INDIVIDUS', statut: 'EN_COURS' },
      ],
    })
    expect(etapes[0]?.detail).toBe('2 lignes et 4 colonnes lues')
    expect(etapes[1]).toMatchObject({
      statut: 'TERMINEE',
      detail: 'Les dates en colonnes (2022, 2023)',
    })
    expect(etapes[2]?.statut).toBe('EN_COURS')
  })

  it('nomme l’étape d’un axe par son nom et compte ses libellés', () => {
    const etapes = buildEtapesAttente({
      tableau,
      cibles,
      etapes: [
        { etape: 'STRUCTURE', statut: 'TERMINEE' },
        { etape: 'INDIVIDUS', statut: 'TERMINEE', resolus: 11, aVerifier: 1 },
        { etape: 'AXE', axe: 'AXE-OPERATEUR', statut: 'TERMINEE', resolus: 1, aVerifier: 0 },
      ],
    })
    expect(etapes[2]?.detail).toBe('11 libellés reconnus, 1 à vérifier')
    expect(etapes[3]).toEqual({
      id: 'axe-AXE-OPERATEUR',
      label: 'Opérateur',
      statut: 'TERMINEE',
      detail: '1 libellé reconnu',
    })
    expect(etapes[4]?.statut).toBe('EN_COURS')
  })

  it('mesure la progression par la part des étapes terminées', () => {
    expect(progressionOf(buildEtapesAttente({ tableau, cibles, etapes: [] }))).toBe(20)
    expect(progressionOf([])).toBe(0)
  })
})
