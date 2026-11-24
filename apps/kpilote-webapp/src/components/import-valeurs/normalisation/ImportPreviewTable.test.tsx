import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ImportPreviewTable } from '@/components/import-valeurs/normalisation/ImportPreviewTable'

const entetes = () => screen.getAllByRole('columnheader').map((cellule) => cellule.textContent)

describe('ImportPreviewTable', () => {
  it('sans axe : colonnes individu, date, valeur', () => {
    render(<ImportPreviewTable rows={[{ individu: 'DEPT-84', date: '2024-01-15', valeur: 7 }]} />)

    expect(entetes()).toEqual(['#', 'individu', 'date', 'valeur'])
  })

  it('avec axes : une colonne par axe, titrée par son nom, avec la modalité de la ligne', () => {
    render(
      <ImportPreviewTable
        rows={[
          {
            individu: 'DEPT-84',
            modalites: ['OP-ORANGE', 'FR-TVA'],
            date: '2024-01-15',
            valeur: 7,
          },
        ]}
        axes={[
          { id: 'AXE-OPERATEUR', nom: 'Opérateur' },
          { id: 'AXE-FRAUDE', nom: 'Type de fraude' },
        ]}
      />,
    )

    expect(entetes()).toEqual(['#', 'individu', 'Opérateur', 'Type de fraude', 'date', 'valeur'])
    expect(screen.getByText('OP-ORANGE')).toBeDefined()
    expect(screen.getByText('FR-TVA')).toBeDefined()
  })
})
