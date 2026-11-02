import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ImportPreviewTable } from '@/components/import-valeurs/ImportPreviewTable'

const enTetes = () => screen.getAllByRole('columnheader').map((cellule) => cellule.textContent)

describe('ImportPreviewTable', () => {
  it('mono : colonnes historiques #, individu, date, valeur', () => {
    render(<ImportPreviewTable rows={[{ individu: 'DEPT-84', date: '2024-01-15', valeur: 7.2 }]} />)
    expect(enTetes()).toEqual(['#', 'individu', 'date', 'valeur'])
  })

  it('multi-dimension : une colonne par colonne d’identité', () => {
    render(
      <ImportPreviewTable
        colonnesIdentite={['territoire (Territoire)', 'operateur (Opérateur)']}
        rows={[
          {
            individu: 'DEPT-84~OP-SFR',
            coordonnees: ['DEPT-84', 'OP-SFR'],
            date: '2024-01-15',
            valeur: 3,
          },
        ]}
      />,
    )
    expect(enTetes()).toEqual([
      '#',
      'territoire (Territoire)',
      'operateur (Opérateur)',
      'date',
      'valeur',
    ])
    const [, ligne] = screen.getAllByRole('row')
    expect(within(ligne!).getByText('OP-SFR')).toBeTruthy()
    expect(within(ligne!).getByText('DEPT-84')).toBeTruthy()
  })
})
