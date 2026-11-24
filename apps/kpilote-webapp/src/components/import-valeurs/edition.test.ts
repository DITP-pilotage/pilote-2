import { type PlanTransformation, type TableauSource } from '@pilote/kpilote-shared/valeurImport'
import { applyPlan, type LigneImport } from '@pilote/kpilote-shared/valeurImport/applyPlan'
import { describe, expect, it } from 'vitest'

import {
  applyCorrection,
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

describe('applyCorrection', () => {
  const tableau: TableauSource = {
    entetes: ['Département', 'Date', 'Taux'],
    lignes: [
      ['Corse', '2024-01-01', 1],
      ['Ain', 'pas une date', 2],
      ['Corse', '2024-02-01', 3],
    ],
  }
  const planAvecAin: PlanTransformation = {
    ...plan,
    individu: {
      colonne: 'Département',
      rapprochements: {
        Corse: { statut: 'INCONNU' },
        Ain: { statut: 'RESOLU', publicId: 'DEPT-01', par: 'EXACT' },
      },
    },
  }
  const depart = selectEdition({ edition: null, key: 'a', plan: planAvecAin })
  const lignesDe = (edition: ReturnType<typeof selectEdition>): LigneImport[] =>
    applyPlan({ plan: edition.plan, tableau, corrections: edition.corrections }).lignes

  it('corriger le rapprochement d’un libellé rend prêtes toutes ses lignes', () => {
    const [premiere] = lignesDe(depart)
    const edition = applyCorrection({
      edition: depart,
      ligne: premiere!,
      correction: {
        type: 'RAPPROCHEMENT',
        edition: {
          type: 'RAPPROCHEMENT',
          cible: { type: 'INDIVIDU' },
          libelle: 'Corse',
          selected: null,
          candidats: [],
          action: 'Choisir un individu',
        },
        publicId: 'DEPT-2A',
      },
    })

    const corses = lignesDe(edition).filter((ligne) => ligne.individu.brut === 'Corse')
    expect(corses.map((ligne) => ligne.individu)).toEqual([
      { statut: 'VALIDE', brut: 'Corse', valeur: 'DEPT-2A', par: 'UTILISATEUR' },
      { statut: 'VALIDE', brut: 'Corse', valeur: 'DEPT-2A', par: 'UTILISATEUR' },
    ])
  })

  it('corriger une date ne touche que sa ligne', () => {
    const lignesDepart = lignesDe(depart)
    const edition = applyCorrection({
      edition: depart,
      ligne: lignesDepart[1]!,
      correction: { type: 'DATE', date: '2024-03-01' },
    })

    const lignesCorrigees = lignesDe(edition)
    expect(lignesCorrigees[1]?.date).toMatchObject({
      statut: 'VALIDE',
      valeur: '2024-03-01',
      par: 'UTILISATEUR',
    })
    expect(lignesCorrigees[0]).toEqual(lignesDepart[0])
    expect(lignesCorrigees[2]).toEqual(lignesDepart[2])
  })

  it('corriger une valeur l’enregistre sur sa ligne', () => {
    const lignesDepart = lignesDe(depart)
    const edition = applyCorrection({
      edition: depart,
      ligne: lignesDepart[2]!,
      correction: { type: 'VALEUR', valeur: 12.4 },
    })

    expect(lignesDe(edition)[2]?.valeur).toMatchObject({
      statut: 'VALIDE',
      valeur: 12.4,
      par: 'UTILISATEUR',
    })
  })
})
