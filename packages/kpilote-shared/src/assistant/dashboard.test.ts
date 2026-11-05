import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  dashboardSchema,
  widgetSchema,
  widgetWidth,
  WIDGET_TYPES,
  type DashboardWidget,
} from './dashboard'

const EXAMPLES = {
  kpi_indicateur: { indicateurId: 'IND-1', individuId: 'DEPT-01' },
  kpi_collection: { collectionId: 'COL-1', individuId: 'DEPT-01' },
  evolution_indicateur: { indicateurId: 'IND-1', individuIds: ['DEPT-01'] },
  tableau_individus: { indicateurId: 'IND-1', individuIds: ['DEPT-01', 'DEPT-02'] },
  contributions_collection: { collectionId: 'COL-1', individuId: 'DEPT-01' },
  valeurs_remarquables: { indicateurId: 'IND-1', referentielId: 'REF-DEPT' },
  carte_indicateur: { indicateurId: 'IND-1', referentielId: 'REF-DEPT' },
  titre_section: { titre: 'Emploi' },
  paragraph: { contenu: ['Une ligne.'] },
} as const

describe('widgetSchema', () => {
  it('accepte chaque type du catalogue', () => {
    expect(
      WIDGET_TYPES.filter((type) => !widgetSchema.safeParse({ type, ...EXAMPLES[type] }).success),
    ).toEqual([])
  })

  it('refuse un type inconnu et un champ en trop', () => {
    expect(widgetSchema.safeParse({ type: 'camembert' }).success).toBe(false)
    expect(
      widgetSchema.safeParse({ type: 'kpi_indicateur', ...EXAMPLES.kpi_indicateur, valeur: 12 })
        .success,
    ).toBe(false)
  })

  it('n’expose aucun const, que gpt-oss ignore', () => {
    expect(JSON.stringify(z.toJSONSchema(dashboardSchema, { io: 'input' }))).not.toContain(
      '"const"',
    )
  })
})

describe('dashboardSchema', () => {
  it('refuse un container vide', () => {
    expect(dashboardSchema.safeParse({ titre: 'T', containers: [{ widgets: [] }] }).success).toBe(
      false,
    )
  })
})

describe('widgetWidth', () => {
  it('rabat une largeur non permise sur la largeur par défaut', () => {
    expect(
      widgetWidth({
        type: 'tableau_individus',
        indicateurId: 'IND-1',
        individuIds: ['DEPT-01', 'DEPT-02'],
        width: 1,
      }),
    ).toBe(4)
    expect(widgetWidth({ type: 'kpi_indicateur', ...EXAMPLES.kpi_indicateur, width: 2 })).toBe(2)
    expect(widgetWidth({ type: 'kpi_indicateur', ...EXAMPLES.kpi_indicateur })).toBe(1)
  })

  it('occupe toute la largeur pour un type que ce front ne connaît pas', () => {
    const futur = JSON.parse('{"type":"jauge","indicateurId":"IND-1"}') as DashboardWidget
    expect(widgetWidth(futur)).toBe(4)
  })
})
