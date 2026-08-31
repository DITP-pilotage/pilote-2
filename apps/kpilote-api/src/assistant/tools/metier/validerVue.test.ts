import { type Vue } from '@pilote/kpilote-shared/assistant/vignettes'
import { describe, expect, it } from 'vitest'

import { contientValeurChiffree, validerVue } from '@/assistant/tools/metier/validerVue'

const contexte = {
  indicateurs: ['IND-1'],
  collections: ['COL-1'],
  individus: ['DEPT-84'],
  referentiels: ['REF-DEPT'],
}

const vue = (vignettes: Vue['vignettes']): Vue => ({ titre: 'Vue', vignettes })

describe('validerVue', () => {
  it('accepte une vue dont tous les identifiants proviennent du contexte', () => {
    const anomalies = validerVue(
      vue([
        {
          type: 'vignette_avancement_indicateur',
          indicateurId: 'IND-1',
          individuId: 'DEPT-84',
          largeur: 'tiers',
        },
      ]),
      contexte,
    )
    expect(anomalies).toEqual([])
  })

  it('rejette un indicateur absent du contexte, en le nommant', () => {
    const anomalies = validerVue(
      vue([
        {
          type: 'vignette_avancement_indicateur',
          indicateurId: 'IND-9',
          individuId: 'DEPT-84',
          largeur: 'tiers',
        },
      ]),
      contexte,
    )
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0]).toContain('IND-9')
  })

  it('rejette un territoire absent du contexte', () => {
    const anomalies = validerVue(
      vue([
        {
          type: 'vignette_taux_collection',
          collectionId: 'COL-1',
          individuId: 'DEPT-13',
          largeur: 'tiers',
        },
      ]),
      contexte,
    )
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0]).toContain('DEPT-13')
  })

  it('rejette un référentiel absent du contexte', () => {
    const anomalies = validerVue(
      vue([
        {
          type: 'vignette_carte_indicateur',
          indicateurId: 'IND-1',
          referentielId: 'REF-REG',
          largeur: 'moitie',
        },
      ]),
      contexte,
    )
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0]).toContain('REF-REG')
  })

  it('rejette un paragraphe qui contient un chiffre — la factualité ne se négocie pas', () => {
    const anomalies = validerVue(
      vue([
        { type: 'vignette_paragraphe', texte: "L'avancement atteint 67 %.", largeur: 'pleine' },
      ]),
      contexte,
    )
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0]).toContain('paragraphe')
  })

  it('laisse passer un paragraphe purement qualitatif', () => {
    const anomalies = validerVue(
      vue([
        {
          type: 'vignette_paragraphe',
          texte: 'La progression reste en deçà de la cible.',
          largeur: 'pleine',
        },
      ]),
      contexte,
    )
    expect(anomalies).toEqual([])
  })

  it('signale toutes les anomalies, pas seulement la première', () => {
    const anomalies = validerVue(
      vue([
        {
          type: 'vignette_avancement_indicateur',
          indicateurId: 'IND-9',
          individuId: 'DEPT-13',
          largeur: 'tiers',
        },
      ]),
      contexte,
    )
    expect(anomalies).toHaveLength(2)
  })
})

describe('contientValeurChiffree', () => {
  it('repère un pourcentage', () => {
    expect(contientValeurChiffree('atteint 67 %')).toBe(true)
    expect(contientValeurChiffree('atteint 67%')).toBe(true)
  })

  it('repère un nombre suivi d’une unité', () => {
    expect(contientValeurChiffree('12 500 logements')).toBe(true)
  })

  it('laisse passer une année ou un identifiant', () => {
    expect(contientValeurChiffree('depuis 2024')).toBe(false)
    expect(contientValeurChiffree('voir IND-1')).toBe(false)
  })
})
