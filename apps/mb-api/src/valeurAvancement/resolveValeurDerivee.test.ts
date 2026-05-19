import { describe, expect, it } from 'vitest'

import { Decimal } from '@/framework/decimal'
import {
  type IndividuRef,
  resolveValeurDerivee,
  type ResolveValeurDeriveeContext,
  type ValeurSaisie,
} from '@/valeurAvancement/resolveValeurDerivee'

const createIndividuRef = (id: string, publicId: string): IndividuRef => ({ id, publicId })
const createValeurSaisie = (valeur: number, date: string): ValeurSaisie => ({
  valeur: new Decimal(valeur),
  date,
})

const buildContext = (
  enfants: Record<string, ReadonlyArray<IndividuRef>>,
  valeurs: Record<string, ValeurSaisie>,
): ResolveValeurDeriveeContext => ({
  enfantsParParent: new Map(Object.entries(enfants)),
  derniereValeurParIndividu: new Map(Object.entries(valeurs)),
})

describe('resolveValeurDerivee', () => {
  it("retourne null et couverture 0/0 quand l'individu cible n'a pas d'enfants", () => {
    const context = buildContext({}, {})

    const result = resolveValeurDerivee('cible', context)

    expect(result).toEqual({
      contributions: [],
      valeurDerivee: null,
      couverture: { nbEnfantsAvecValeur: 0, nbEnfantsTotal: 0 },
    })
  })

  it('somme les valeurs saisies de tous les enfants directs (1 niveau, couverture complète)', () => {
    const context = buildContext(
      {
        cible: [
          createIndividuRef('a', 'DEPT-A'),
          createIndividuRef('b', 'DEPT-B'),
          createIndividuRef('c', 'DEPT-C'),
        ],
      },
      {
        a: createValeurSaisie(10, '2025-01-01'),
        b: createValeurSaisie(20, '2025-02-01'),
        c: createValeurSaisie(30, '2025-03-01'),
      },
    )

    const result = resolveValeurDerivee('cible', context)

    expect(result).toEqual({
      contributions: [
        { individu: 'DEPT-A', valeur: 10, date: '2025-01-01', source: 'saisie' },
        { individu: 'DEPT-B', valeur: 20, date: '2025-02-01', source: 'saisie' },
        { individu: 'DEPT-C', valeur: 30, date: '2025-03-01', source: 'saisie' },
      ],
      valeurDerivee: 60,
      couverture: { nbEnfantsAvecValeur: 3, nbEnfantsTotal: 3 },
    })
  })

  it('expose les enfants sans valeur comme `manquante` et somme uniquement les présents (couverture partielle)', () => {
    const context = buildContext(
      {
        cible: [
          createIndividuRef('a', 'DEPT-A'),
          createIndividuRef('b', 'DEPT-B'),
          createIndividuRef('c', 'DEPT-C'),
        ],
      },
      {
        a: createValeurSaisie(10, '2025-01-01'),
        c: createValeurSaisie(30, '2025-03-01'),
      },
    )

    const result = resolveValeurDerivee('cible', context)

    expect(result).toEqual({
      contributions: [
        { individu: 'DEPT-A', valeur: 10, date: '2025-01-01', source: 'saisie' },
        { individu: 'DEPT-B', valeur: null, date: null, source: 'manquante' },
        { individu: 'DEPT-C', valeur: 30, date: '2025-03-01', source: 'saisie' },
      ],
      valeurDerivee: 40,
      couverture: { nbEnfantsAvecValeur: 2, nbEnfantsTotal: 3 },
    })
  })

  it('trie les contributions par publicId quel que soit l’ordre des enfants en entrée', () => {
    const context = buildContext(
      {
        cible: [
          createIndividuRef('c', 'DEPT-Z'),
          createIndividuRef('a', 'DEPT-A'),
          createIndividuRef('b', 'DEPT-M'),
        ],
      },
      {
        a: createValeurSaisie(1, '2025-01-01'),
        b: createValeurSaisie(2, '2025-01-01'),
        c: createValeurSaisie(3, '2025-01-01'),
      },
    )

    const result = resolveValeurDerivee('cible', context)

    expect(result.contributions.map((c) => c.individu)).toEqual(['DEPT-A', 'DEPT-M', 'DEPT-Z'])
  })

  it('dérive le niveau intermédiaire à partir des feuilles (grand-parent, 2 niveaux)', () => {
    // France → 2 régions → chacune 2 départements (feuilles saisies)
    const context = buildContext(
      {
        france: [createIndividuRef('reg-n', 'REG-N'), createIndividuRef('reg-s', 'REG-S')],
        'reg-n': [createIndividuRef('dept-n1', 'DEPT-N1'), createIndividuRef('dept-n2', 'DEPT-N2')],
        'reg-s': [createIndividuRef('dept-s1', 'DEPT-S1'), createIndividuRef('dept-s2', 'DEPT-S2')],
      },
      {
        'dept-n1': createValeurSaisie(10, '2025-01-01'),
        'dept-n2': createValeurSaisie(20, '2025-02-01'),
        'dept-s1': createValeurSaisie(100, '2025-03-01'),
        'dept-s2': createValeurSaisie(200, '2025-04-01'),
      },
    )

    const result = resolveValeurDerivee('france', context)

    // Contributions de France = les régions (source dérivée), pas les départements
    expect(result).toEqual({
      contributions: [
        { individu: 'REG-N', valeur: 30, date: '2025-02-01', source: 'derivee' },
        { individu: 'REG-S', valeur: 300, date: '2025-04-01', source: 'derivee' },
      ],
      valeurDerivee: 330,
      couverture: { nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 },
    })
  })

  it('priorise la saisie sur un nœud intermédiaire (D1 : saisie ≻ dérivée pour la contribution au parent)', () => {
    // La région N a une saisie officielle ; ses départements ont aussi des saisies → on prend la saisie de la région
    const context = buildContext(
      {
        france: [createIndividuRef('reg-n', 'REG-N'), createIndividuRef('reg-s', 'REG-S')],
        'reg-n': [createIndividuRef('dept-n1', 'DEPT-N1'), createIndividuRef('dept-n2', 'DEPT-N2')],
        'reg-s': [createIndividuRef('dept-s1', 'DEPT-S1'), createIndividuRef('dept-s2', 'DEPT-S2')],
      },
      {
        'reg-n': createValeurSaisie(999, '2020-01-01'), // saisie officielle, ancienne mais prioritaire
        'dept-n1': createValeurSaisie(10, '2025-01-01'),
        'dept-n2': createValeurSaisie(20, '2025-02-01'),
        'dept-s1': createValeurSaisie(100, '2025-03-01'),
        'dept-s2': createValeurSaisie(200, '2025-04-01'),
      },
    )

    const result = resolveValeurDerivee('france', context)

    expect(result.contributions).toEqual([
      { individu: 'REG-N', valeur: 999, date: '2020-01-01', source: 'saisie' },
      { individu: 'REG-S', valeur: 300, date: '2025-04-01', source: 'derivee' },
    ])
    expect(result.valeurDerivee).toBe(1299)
  })

  it("marque comme manquante un enfant qui n'a ni saisie ni descendants avec valeur", () => {
    const context = buildContext(
      {
        cible: [
          createIndividuRef('reg-vide', 'REG-VIDE'),
          createIndividuRef('reg-pleine', 'REG-PLEINE'),
        ],
        'reg-vide': [createIndividuRef('dept-vide', 'DEPT-VIDE')], // descendants existent mais aucune saisie
        'reg-pleine': [createIndividuRef('dept-p', 'DEPT-P')],
      },
      {
        'dept-p': createValeurSaisie(50, '2025-01-01'),
      },
    )

    const result = resolveValeurDerivee('cible', context)

    expect(result).toEqual({
      contributions: [
        { individu: 'REG-PLEINE', valeur: 50, date: '2025-01-01', source: 'derivee' },
        { individu: 'REG-VIDE', valeur: null, date: null, source: 'manquante' },
      ],
      valeurDerivee: 50,
      couverture: { nbEnfantsAvecValeur: 1, nbEnfantsTotal: 2 },
    })
  })

  it('retourne valeurDerivee null quand tous les enfants sont absents', () => {
    const context = buildContext(
      {
        cible: [createIndividuRef('a', 'DEPT-A'), createIndividuRef('b', 'DEPT-B')],
      },
      {},
    )

    const result = resolveValeurDerivee('cible', context)

    expect(result).toEqual({
      contributions: [
        { individu: 'DEPT-A', valeur: null, date: null, source: 'manquante' },
        { individu: 'DEPT-B', valeur: null, date: null, source: 'manquante' },
      ],
      valeurDerivee: null,
      couverture: { nbEnfantsAvecValeur: 0, nbEnfantsTotal: 2 },
    })
  })

  it('utilise la date la plus récente parmi les contributions dérivées', () => {
    const context = buildContext(
      {
        cible: [createIndividuRef('reg', 'REG-X')],
        reg: [
          createIndividuRef('d1', 'D1'),
          createIndividuRef('d2', 'D2'),
          createIndividuRef('d3', 'D3'),
        ],
      },
      {
        d1: createValeurSaisie(1, '2024-01-01'),
        d2: createValeurSaisie(2, '2025-06-15'),
        d3: createValeurSaisie(3, '2024-12-31'),
      },
    )

    const result = resolveValeurDerivee('cible', context)

    expect(result.contributions[0]).toEqual({
      individu: 'REG-X',
      valeur: 6,
      date: '2025-06-15',
      source: 'derivee',
    })
  })
})
