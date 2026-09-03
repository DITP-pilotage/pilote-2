import { type View } from '@pilote/kpilote-shared/assistant/tiles'
import { describe, expect, it } from 'vitest'

import { containsNumericValue, validateView } from '@/assistant/tools/business/validateView'

const context = {
  indicateurs: ['IND-1'],
  collections: ['COL-1'],
  individus: ['DEPT-84'],
  referentiels: ['REF-DEPT'],
}

const view = (tiles: View['tiles']): View => ({ title: 'View', tiles })

describe('validateView', () => {
  it('accepte une vue dont tous les identifiants proviennent du context', () => {
    const issues = validateView(
      view([
        {
          type: 'tile_avancement_indicateur',
          indicateurId: 'IND-1',
          individuId: 'DEPT-84',
          width: 'third',
        },
      ]),
      context,
    )
    expect(issues).toEqual([])
  })

  it('rejette un indicateur absent du context, en le nommant', () => {
    const issues = validateView(
      view([
        {
          type: 'tile_avancement_indicateur',
          indicateurId: 'IND-9',
          individuId: 'DEPT-84',
          width: 'third',
        },
      ]),
      context,
    )
    expect(issues).toHaveLength(1)
    expect(issues[0]).toContain('IND-9')
  })

  it('rejette un territoire absent du context', () => {
    const issues = validateView(
      view([
        {
          type: 'tile_taux_collection',
          collectionId: 'COL-1',
          individuId: 'DEPT-13',
          width: 'third',
        },
      ]),
      context,
    )
    expect(issues).toHaveLength(1)
    expect(issues[0]).toContain('DEPT-13')
  })

  it('rejette un référentiel absent du context', () => {
    const issues = validateView(
      view([
        {
          type: 'tile_carte_indicateur',
          indicateurId: 'IND-1',
          referentielId: 'REF-REG',
          width: 'half',
        },
      ]),
      context,
    )
    expect(issues).toHaveLength(1)
    expect(issues[0]).toContain('REF-REG')
  })

  it('rejette un paragraphe qui contient un chiffre — la factualité ne se négocie pas', () => {
    const issues = validateView(
      view([{ type: 'tile_paragraphe', text: "L'avancement atteint 67 %.", width: 'full' }]),
      context,
    )
    expect(issues).toHaveLength(1)
    expect(issues[0]).toContain('paragraphe')
  })

  it('laisse passer un paragraphe purement qualitatif', () => {
    const issues = validateView(
      view([
        {
          type: 'tile_paragraphe',
          text: 'La progression reste en deçà de la cible.',
          width: 'full',
        },
      ]),
      context,
    )
    expect(issues).toEqual([])
  })

  it('signale toutes les issues, pas seulement la première', () => {
    const issues = validateView(
      view([
        {
          type: 'tile_avancement_indicateur',
          indicateurId: 'IND-9',
          individuId: 'DEPT-13',
          width: 'third',
        },
      ]),
      context,
    )
    expect(issues).toHaveLength(2)
  })
})

describe('containsNumericValue', () => {
  it('repère un pourcentage', () => {
    expect(containsNumericValue('atteint 67 %')).toBe(true)
    expect(containsNumericValue('atteint 67%')).toBe(true)
  })

  it("repère un nombre suivi d'une unité", () => {
    expect(containsNumericValue('12 500 logements')).toBe(true)
  })

  it('laisse passer une année ou un identifiant', () => {
    expect(containsNumericValue('depuis 2024')).toBe(false)
    expect(containsNumericValue('voir IND-1')).toBe(false)
  })
})
