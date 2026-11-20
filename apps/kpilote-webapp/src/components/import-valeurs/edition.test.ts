import { type PlanTransformation } from '@pilote/kpilote-shared/valeurImport'
import { describe, expect, it } from 'vitest'

import {
  selectEdition,
  withCorrection,
  withRapprochement,
} from '@/components/import-valeurs/edition'

const plan: PlanTransformation = {
  individu: { colonne: 'Département', rapprochements: { Corse: { statut: 'INCONNU' } } },
  axes: [],
  valeurs: { disposition: 'LIGNES', colonneDate: 'Date', colonneValeur: 'Taux' },
}

describe('selectEdition', () => {
  it('part du plan de départ sans correction', () => {
    expect(selectEdition({ edition: null, key: 'a', plan })).toEqual({
      key: 'a',
      plan,
      corrections: {},
    })
  })

  it('garde les corrections du même fichier et oublie celles d’un autre', () => {
    const edition = withCorrection({
      edition: selectEdition({ edition: null, key: 'a', plan }),
      source: { ligne: 0, colonneValeur: 'Taux' },
      correction: { valeur: 3 },
    })
    expect(selectEdition({ edition, key: 'a', plan })).toBe(edition)
    expect(selectEdition({ edition, key: 'b', plan }).corrections).toEqual({})
  })
})

describe('withCorrection', () => {
  it('cumule la date et la valeur corrigées d’une même ligne', () => {
    const source = { ligne: 2, colonneValeur: 'Taux' }
    const first = withCorrection({
      edition: selectEdition({ edition: null, key: 'a', plan }),
      source,
      correction: { valeur: 3 },
    })
    const second = withCorrection({ edition: first, source, correction: { date: '2024-01-01' } })
    expect(second.corrections).toEqual({ '2:Taux': { valeur: 3, date: '2024-01-01' } })
  })
})

describe('withRapprochement', () => {
  it('résout le libellé dans le plan, au nom de l’utilisateur', () => {
    const edition = withRapprochement({
      edition: selectEdition({ edition: null, key: 'a', plan }),
      cible: { type: 'INDIVIDU' },
      libelle: 'Corse',
      publicId: 'DEPT-2A',
    })
    expect(edition.plan.individu.rapprochements).toEqual({
      Corse: { statut: 'RESOLU', publicId: 'DEPT-2A', par: 'UTILISATEUR' },
    })
  })
})
