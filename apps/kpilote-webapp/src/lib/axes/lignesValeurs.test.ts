import { TOUS_ID } from '@pilote/kpilote-shared/modaliteTree'
import { describe, expect, it } from 'vitest'

import { buildLignesValeurs } from '@/lib/axes/lignesValeurs'
import { buildTableauValeursContext } from '@/lib/axes/tableauValeurs'

const modalite = ({ id, parent = null }: { id: string; parent?: string | null }) => ({
  id,
  nom: id.toLowerCase(),
  niveau: parent ? 2 : 1,
  parent,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

// Un item par combinaison, avec toute sa série.
const serie = ({
  modalites,
  points,
}: {
  modalites: string[]
  points: ReadonlyArray<{ date: string; valeur: number }>
}) => ({
  modalites,
  valeurs: points.map(({ date, valeur }) => ({
    indicateur: 'IND-1',
    individu: 'DEPT-01',
    modalites,
    date,
    valeur,
    type: 'saisie' as const,
  })),
})

describe('buildLignesValeurs', () => {
  it('décompose le cube en une ligne par combinaison de feuilles et par date, dans l’ordre des axes', () => {
    const context = buildTableauValeursContext({
      axes: [
        {
          id: 'OP',
          nom: 'Opérateur',
          fonction: 'SUM',
          modalites: [
            modalite({ id: 'MOBILE' }),
            modalite({ id: 'ORANGE', parent: 'MOBILE' }),
            modalite({ id: 'SFR', parent: 'MOBILE' }),
          ],
        },
      ],
      items: [
        serie({ modalites: ['SFR'], points: [{ date: '2025-01-01', valeur: 2 }] }),
        serie({
          modalites: ['ORANGE'],
          points: [
            { date: '2025-04-01', valeur: 3 },
            { date: '2025-01-01', valeur: 1 },
          ],
        }),
        // Une parente n'est pas une ligne : elle se calcule.
        serie({ modalites: ['MOBILE'], points: [{ date: '2025-01-01', valeur: 3 }] }),
      ],
    })

    const { colonnes, lignes, cibles } = buildLignesValeurs({
      context,
      individu: { id: 'DEPT-01', nom: 'Ain' },
    })

    expect(colonnes.map((colonne) => colonne.label)).toEqual([
      'Individu',
      'Opérateur',
      'Date',
      'Valeur',
    ])
    expect(lignes.map((ligne) => ligne.cellules.map((cellule) => cellule.text))).toEqual([
      ['Ain', 'orange', '01/01/2025', '1'],
      ['Ain', 'orange', '01/04/2025', '3'],
      ['Ain', 'sfr', '01/01/2025', '2'],
    ])
    expect(cibles[1]).toEqual({ ids: ['ORANGE'], periode: '2025-04-01' })
    expect(cibles.every((cible) => !cible.ids.includes(TOUS_ID))).toBe(true)
  })
})
