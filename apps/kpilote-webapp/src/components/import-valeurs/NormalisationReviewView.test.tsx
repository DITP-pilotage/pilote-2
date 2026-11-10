import { render, screen } from '@testing-library/react'
import type { NormaliserValeursImportResponseApiModel } from '@pilote/kpilote-shared/valeurImport'
import { describe, expect, it } from 'vitest'

import { NormalisationReviewView } from '@/components/import-valeurs/NormalisationReviewView'

const rapport = {
  totalLignes: 1,
  totalItemsProduits: 1,
  totalLibellesSources: 2,
  totalLibellesMappes: 2,
  totalLibellesNonResolus: 0,
}

const enTetes = () => screen.getAllByRole('columnheader').map((cellule) => cellule.textContent)

describe('NormalisationReviewView', () => {
  it('mono : prévisualisation historique', () => {
    const revue: NormaliserValeursImportResponseApiModel = {
      plan: {
        layout: 'long',
        colonneIndividu: 'zone',
        colonneDate: { nom: 'date' },
        colonneValeur: 'valeur',
      },
      resolution: {
        mapping: [{ libelleSource: 'Ain', individuPublicId: 'DEPT-01' }],
        nonResolus: [],
      },
      items: [{ individu: 'DEPT-01', date: '2025-01-01', valeur: 1 }],
      warnings: [],
      rapport,
    }
    render(<NormalisationReviewView response={revue} />)
    expect(enTetes()).toEqual(['#', 'individu', 'date', 'valeur'])
  })

  it('multi-dimension : une colonne par coordonnée, libellée par la dimension', () => {
    const revue: NormaliserValeursImportResponseApiModel = {
      plan: {
        layout: 'pivot',
        colonneIndividu: 'operateur',
        colonnesIdentiteSupplementaires: ['territoire'],
        colonnesPivot: [{ nom: '2025-01', dateIso: '2025-01-01' }],
      },
      resolution: {
        mapping: [
          { colonne: 'operateur', libelleSource: 'Orange', individuPublicId: 'OP-ORANGE' },
          { colonne: 'territoire', libelleSource: 'Orange', individuPublicId: 'COM-84087' },
        ],
        nonResolus: [],
        colonnesIdentite: [
          { colonne: 'territoire', dimension: { id: 'DIM-TERRITOIRE', nom: 'Territoire' } },
          { colonne: 'operateur', dimension: { id: 'DIM-OPERATEUR', nom: 'Opérateur' } },
        ],
      },
      items: [
        {
          individu: 'COM-84087~OP-ORANGE',
          coordonnees: ['COM-84087', 'OP-ORANGE'],
          date: '2025-01-01',
          valeur: 1,
        },
      ],
      warnings: [],
      rapport,
    }
    render(<NormalisationReviewView response={revue} />)
    expect(enTetes()).toEqual([
      '#',
      'territoire (Territoire)',
      'operateur (Opérateur)',
      'date',
      'valeur',
    ])
    expect(screen.getByText('COM-84087')).toBeTruthy()
    expect(screen.getByText('OP-ORANGE')).toBeTruthy()
  })
})
