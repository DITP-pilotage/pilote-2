import { type PeriodeMiseAJour } from '@pilote/kpilote-shared/indicateur'
import { describe, expect, it } from 'vitest'

import { computeDatesMiseADisposition } from '@/indicateur/datesMiseADisposition'

describe('computeDatesMiseADisposition', () => {
  it('scénario données fiscales : annuelle + délai semestre', () => {
    expect(
      computeDatesMiseADisposition({
        dateDerniereValeur: '2023-12-01',
        periodeMiseAJour: 'ANNUELLE',
        delai: { nombre: 6, unite: 'MOIS' },
      }),
    ).toEqual({
      dateDerniereValeur: '2023-12-01',
      dateProchaineValeur: '2024-12-01',
      dateMiseADisposition: '2025-06-01',
    })
  })

  it('délai annuel : mise à dispo un an après la prochaine valeur', () => {
    expect(
      computeDatesMiseADisposition({
        dateDerniereValeur: '2023-12-01',
        periodeMiseAJour: 'ANNUELLE',
        delai: { nombre: 1, unite: 'ANNEES' },
      }).dateMiseADisposition,
    ).toBe('2025-12-01')
  })

  it('mappe chaque période vers le bon intervalle', () => {
    const prochaine = (periodeMiseAJour: PeriodeMiseAJour) =>
      computeDatesMiseADisposition({
        dateDerniereValeur: '2024-01-15',
        periodeMiseAJour,
        delai: null,
      }).dateProchaineValeur
    expect(prochaine('QUOTIDIENNE')).toBe('2024-01-16')
    expect(prochaine('HEBDOMADAIRE')).toBe('2024-01-22')
    expect(prochaine('BIMENSUELLE')).toBe('2024-01-30')
    expect(prochaine('MENSUELLE')).toBe('2024-02-15')
    expect(prochaine('TRIMESTRIELLE')).toBe('2024-04-15')
    expect(prochaine('SEMESTRIELLE')).toBe('2024-07-15')
    expect(prochaine('ANNUELLE')).toBe('2025-01-15')
  })

  it('clampe le jour en cas de débordement de mois (31 janv. + 1 mois, année bissextile)', () => {
    expect(
      computeDatesMiseADisposition({
        dateDerniereValeur: '2024-01-31',
        periodeMiseAJour: 'MENSUELLE',
        delai: null,
      }).dateProchaineValeur,
    ).toBe('2024-02-29')
  })

  it('applique le délai en jours et en semaines', () => {
    expect(
      computeDatesMiseADisposition({
        dateDerniereValeur: '2024-01-15',
        periodeMiseAJour: 'MENSUELLE',
        delai: { nombre: 10, unite: 'JOURS' },
      }).dateMiseADisposition,
    ).toBe('2024-02-25')
    expect(
      computeDatesMiseADisposition({
        dateDerniereValeur: '2024-01-15',
        periodeMiseAJour: 'MENSUELLE',
        delai: { nombre: 2, unite: 'SEMAINES' },
      }).dateMiseADisposition,
    ).toBe('2024-02-29')
  })

  it('propage les null : pas de valeur, période AUCUNE/null, délai absent', () => {
    expect(
      computeDatesMiseADisposition({
        dateDerniereValeur: null,
        periodeMiseAJour: 'ANNUELLE',
        delai: { nombre: 6, unite: 'MOIS' },
      }),
    ).toEqual({
      dateDerniereValeur: null,
      dateProchaineValeur: null,
      dateMiseADisposition: null,
    })

    expect(
      computeDatesMiseADisposition({
        dateDerniereValeur: '2023-12-01',
        periodeMiseAJour: 'AUCUNE',
        delai: { nombre: 6, unite: 'MOIS' },
      }),
    ).toEqual({
      dateDerniereValeur: '2023-12-01',
      dateProchaineValeur: null,
      dateMiseADisposition: null,
    })

    expect(
      computeDatesMiseADisposition({
        dateDerniereValeur: '2023-12-01',
        periodeMiseAJour: null,
        delai: null,
      }),
    ).toEqual({
      dateDerniereValeur: '2023-12-01',
      dateProchaineValeur: null,
      dateMiseADisposition: null,
    })

    expect(
      computeDatesMiseADisposition({
        dateDerniereValeur: '2023-12-01',
        periodeMiseAJour: 'ANNUELLE',
        delai: null,
      }),
    ).toEqual({
      dateDerniereValeur: '2023-12-01',
      dateProchaineValeur: '2024-12-01',
      dateMiseADisposition: null,
    })
  })
})
