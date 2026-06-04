import { describe, expect, it } from 'vitest'

import { parseBucket } from '@/framework/bucket'
import { Decimal } from '@/framework/decimal'
import {
  type IndividuRef,
  type PointInterne,
  resolveSerieIndividu,
  type ResolveSerieContext,
  type SaisieTronquee,
} from '@/valeurAvancement/resolveSerieIndividu'

const d = (n: number): Decimal => new Decimal(n)
const b = parseBucket
const saisie = (bucket: string, valeur: number, dateOrigine = bucket): SaisieTronquee => ({
  bucket: b(bucket),
  dateOrigine: b(dateOrigine),
  valeur: d(valeur),
})

const REF_PAYS = 'ref-pays'
const REF_REG = 'ref-reg'
const REF_DEPT = 'ref-dept'

const FRANCE: IndividuRef = { id: 'i-france', publicId: 'FRANCE', referentielId: REF_PAYS }
const REG_N: IndividuRef = { id: 'i-reg-n', publicId: 'REG-N', referentielId: REF_REG }
const REG_S: IndividuRef = { id: 'i-reg-s', publicId: 'REG-S', referentielId: REF_REG }
const DEPT_A: IndividuRef = { id: 'i-dept-a', publicId: 'DEPT-A', referentielId: REF_DEPT }
const DEPT_B: IndividuRef = { id: 'i-dept-b', publicId: 'DEPT-B', referentielId: REF_DEPT }
const DEPT_C: IndividuRef = { id: 'i-dept-c', publicId: 'DEPT-C', referentielId: REF_DEPT }
const DEPT_D: IndividuRef = { id: 'i-dept-d', publicId: 'DEPT-D', referentielId: REF_DEPT }

const buildContext = (input: {
  enfantsParParent?: Record<string, IndividuRef[]>
  fonctionAgregationParReferentiel?: Record<string, 'SUM' | 'AVG' | 'NONE'>
  serieFeuilleParIndividu?: Record<string, SaisieTronquee[]>
  individusReferentiel?: Record<string, string>
}): ResolveSerieContext => ({
  enfantsParParent: new Map(Object.entries(input.enfantsParParent ?? {})),
  fonctionAgregationParReferentiel: new Map(
    Object.entries(input.fonctionAgregationParReferentiel ?? {}),
  ),
  serieFeuilleParIndividu: new Map(Object.entries(input.serieFeuilleParIndividu ?? {})),
  referentielParIndividu: new Map(Object.entries(input.individusReferentiel ?? {})),
})

describe('resolveSerieIndividu — feuille', () => {
  it('retourne une série vide pour une feuille sans saisies', async () => {
    const ctx = buildContext({ individusReferentiel: { [DEPT_A.id]: REF_DEPT } })
    const cache = new Map<string, ReadonlyArray<PointInterne>>()
    expect(await resolveSerieIndividu(DEPT_A.id, ctx, cache)).toEqual([])
  })

  it('retourne la série de saisies tronquée pour une feuille', async () => {
    const ctx = buildContext({
      individusReferentiel: { [DEPT_A.id]: REF_DEPT },
      serieFeuilleParIndividu: {
        [DEPT_A.id]: [
          saisie('2025-01-01', 10, '2025-01-18'),
          saisie('2025-02-01', 20, '2025-02-05'),
        ],
      },
    })
    const cache = new Map<string, ReadonlyArray<PointInterne>>()
    const serie = await resolveSerieIndividu(DEPT_A.id, ctx, cache)

    expect(serie).toHaveLength(2)
    expect(serie[0]).toEqual({
      type: 'saisie',
      bucket: b('2025-01-01'),
      dateOrigine: b('2025-01-18'),
      valeur: d(10),
    })
    expect(serie[1]).toEqual({
      type: 'saisie',
      bucket: b('2025-02-01'),
      dateOrigine: b('2025-02-05'),
      valeur: d(20),
    })
  })

  it('traite un nœud sans fonctionAgregation comme une feuille (lit ses saisies)', async () => {
    const ctx = buildContext({
      individusReferentiel: { [FRANCE.id]: REF_PAYS },
      enfantsParParent: { [FRANCE.id]: [REG_N] },
      fonctionAgregationParReferentiel: { [REF_PAYS]: 'NONE' },
      serieFeuilleParIndividu: {
        [FRANCE.id]: [saisie('2025-01-01', 99)],
      },
    })
    const cache = new Map<string, ReadonlyArray<PointInterne>>()
    const serie = await resolveSerieIndividu(FRANCE.id, ctx, cache)

    expect(serie).toHaveLength(1)
    expect(serie[0]).toMatchObject({ type: 'saisie', valeur: d(99) })
  })
})

describe('resolveSerieIndividu — agrégation 1 niveau', () => {
  it('agrège par bucket avec couverture complète', async () => {
    const ctx = buildContext({
      individusReferentiel: {
        [REG_S.id]: REF_REG,
        [DEPT_A.id]: REF_DEPT,
        [DEPT_B.id]: REF_DEPT,
      },
      enfantsParParent: { [REG_S.id]: [DEPT_A, DEPT_B] },
      fonctionAgregationParReferentiel: { [REF_REG]: 'SUM' },
      serieFeuilleParIndividu: {
        [DEPT_A.id]: [saisie('2025-01-01', 10), saisie('2025-02-01', 15)],
        [DEPT_B.id]: [saisie('2025-01-01', 100), saisie('2025-02-01', 200)],
      },
    })

    const serie = await resolveSerieIndividu(REG_S.id, ctx, new Map())

    expect(serie).toHaveLength(2)
    expect(serie[0]).toMatchObject({
      type: 'derivee',
      bucket: b('2025-01-01'),
      valeur: d(110),
      fonctionAgregation: 'SUM',
      couverture: { nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 },
    })
    expect(serie[1]).toMatchObject({
      type: 'derivee',
      bucket: b('2025-02-01'),
      valeur: d(215),
      couverture: { nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 },
    })
  })

  it('émet dès la première valeur connue (combineLatest permissif)', async () => {
    const ctx = buildContext({
      individusReferentiel: {
        [REG_S.id]: REF_REG,
        [DEPT_A.id]: REF_DEPT,
        [DEPT_B.id]: REF_DEPT,
      },
      enfantsParParent: { [REG_S.id]: [DEPT_A, DEPT_B] },
      fonctionAgregationParReferentiel: { [REF_REG]: 'SUM' },
      serieFeuilleParIndividu: {
        [DEPT_A.id]: [saisie('2025-01-01', 10), saisie('2025-03-01', 30)],
        [DEPT_B.id]: [saisie('2025-02-01', 50)],
      },
    })

    const serie = await resolveSerieIndividu(REG_S.id, ctx, new Map())

    expect(serie).toHaveLength(3)
    // 2025-01 : seul DEPT-A connu → valeur=10, couverture 1/2
    expect(serie[0]).toMatchObject({
      bucket: b('2025-01-01'),
      valeur: d(10),
      couverture: { nbEnfantsAvecValeur: 1, nbEnfantsTotal: 2 },
    })
    expect((serie[0] as { contributions: unknown[] }).contributions).toEqual([
      { individuPublicId: 'DEPT-A', valeur: d(10), dateOrigine: b('2025-01-01'), source: 'saisie' },
      { individuPublicId: 'DEPT-B', valeur: null, dateOrigine: null, source: 'manquante' },
    ])
    // 2025-02 : DEPT-A carry-forward (10) + DEPT-B (50) → 60, couverture 2/2
    expect(serie[1]).toMatchObject({
      bucket: b('2025-02-01'),
      valeur: d(60),
      couverture: { nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 },
    })
    // 2025-03 : DEPT-A (30) + DEPT-B carry-forward (50) → 80
    expect(serie[2]).toMatchObject({ bucket: b('2025-03-01'), valeur: d(80) })
  })

  it('trie les contributions par publicId', async () => {
    // Enfants déclarés dans un ordre non alphabétique
    const ctx = buildContext({
      individusReferentiel: {
        [REG_S.id]: REF_REG,
        [DEPT_B.id]: REF_DEPT,
        [DEPT_A.id]: REF_DEPT,
      },
      enfantsParParent: { [REG_S.id]: [DEPT_B, DEPT_A] },
      fonctionAgregationParReferentiel: { [REF_REG]: 'SUM' },
      serieFeuilleParIndividu: {
        [DEPT_A.id]: [saisie('2025-01-01', 1)],
        [DEPT_B.id]: [saisie('2025-01-01', 2)],
      },
    })

    const serie = await resolveSerieIndividu(REG_S.id, ctx, new Map())
    const contributions = (serie[0] as { contributions: { individuPublicId: string }[] })
      .contributions

    expect(contributions.map((c) => c.individuPublicId)).toEqual(['DEPT-A', 'DEPT-B'])
  })

  it("n'émet rien si aucun enfant n'a jamais saisi", async () => {
    const ctx = buildContext({
      individusReferentiel: {
        [REG_S.id]: REF_REG,
        [DEPT_A.id]: REF_DEPT,
        [DEPT_B.id]: REF_DEPT,
      },
      enfantsParParent: { [REG_S.id]: [DEPT_A, DEPT_B] },
      fonctionAgregationParReferentiel: { [REF_REG]: 'SUM' },
    })

    expect(await resolveSerieIndividu(REG_S.id, ctx, new Map())).toEqual([])
  })

  it('ignore les saisies sur un nœud agrégé (D6 : saisie ignorée si fonctionAgregation)', async () => {
    const ctx = buildContext({
      individusReferentiel: {
        [REG_S.id]: REF_REG,
        [DEPT_A.id]: REF_DEPT,
      },
      enfantsParParent: { [REG_S.id]: [DEPT_A] },
      fonctionAgregationParReferentiel: { [REF_REG]: 'SUM' },
      serieFeuilleParIndividu: {
        [REG_S.id]: [saisie('2025-01-01', 9999)], // saisie parasite sur le nœud agrégé
        [DEPT_A.id]: [saisie('2025-01-01', 42)],
      },
    })

    const serie = await resolveSerieIndividu(REG_S.id, ctx, new Map())

    expect(serie).toHaveLength(1)
    expect(serie[0]).toMatchObject({ type: 'derivee', valeur: d(42) })
  })
})

describe('resolveSerieIndividu — agrégation AVG', () => {
  it('calcule la moyenne arithmétique simple sur couverture complète', async () => {
    const ctx = buildContext({
      individusReferentiel: {
        [REG_S.id]: REF_REG,
        [DEPT_A.id]: REF_DEPT,
        [DEPT_B.id]: REF_DEPT,
      },
      enfantsParParent: { [REG_S.id]: [DEPT_A, DEPT_B] },
      fonctionAgregationParReferentiel: { [REF_REG]: 'AVG' },
      serieFeuilleParIndividu: {
        [DEPT_A.id]: [saisie('2025-01-01', 10), saisie('2025-02-01', 20)],
        [DEPT_B.id]: [saisie('2025-01-01', 30), saisie('2025-02-01', 40)],
      },
    })

    const serie = await resolveSerieIndividu(REG_S.id, ctx, new Map())

    expect(serie).toHaveLength(2)
    expect(serie[0]).toMatchObject({
      type: 'derivee',
      bucket: b('2025-01-01'),
      valeur: d(20), // (10 + 30) / 2
      fonctionAgregation: 'AVG',
      couverture: { nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 },
    })
    expect(serie[1]).toMatchObject({ bucket: b('2025-02-01'), valeur: d(30) }) // (20 + 40) / 2
  })

  it('moyenne sur les enfants connus uniquement (permissif, comme SUM)', async () => {
    const ctx = buildContext({
      individusReferentiel: {
        [REG_S.id]: REF_REG,
        [DEPT_A.id]: REF_DEPT,
        [DEPT_B.id]: REF_DEPT,
      },
      enfantsParParent: { [REG_S.id]: [DEPT_A, DEPT_B] },
      fonctionAgregationParReferentiel: { [REF_REG]: 'AVG' },
      serieFeuilleParIndividu: {
        [DEPT_A.id]: [saisie('2025-01-01', 10)],
        [DEPT_B.id]: [saisie('2025-02-01', 40)],
      },
    })

    const serie = await resolveSerieIndividu(REG_S.id, ctx, new Map())

    expect(serie).toHaveLength(2)
    // 2025-01 : seul DEPT-A → moyenne sur 1 = 10, couverture 1/2
    expect(serie[0]).toMatchObject({
      bucket: b('2025-01-01'),
      valeur: d(10),
      couverture: { nbEnfantsAvecValeur: 1, nbEnfantsTotal: 2 },
    })
    // 2025-02 : DEPT-A carry-forward (10) + DEPT-B (40) → moyenne 25
    expect(serie[1]).toMatchObject({ bucket: b('2025-02-01'), valeur: d(25) })
  })

  it("n'émet rien si aucun enfant n'a jamais saisi (évite la division par zéro)", async () => {
    const ctx = buildContext({
      individusReferentiel: {
        [REG_S.id]: REF_REG,
        [DEPT_A.id]: REF_DEPT,
        [DEPT_B.id]: REF_DEPT,
      },
      enfantsParParent: { [REG_S.id]: [DEPT_A, DEPT_B] },
      fonctionAgregationParReferentiel: { [REF_REG]: 'AVG' },
    })

    expect(await resolveSerieIndividu(REG_S.id, ctx, new Map())).toEqual([])
  })

  it('produit une moyenne décimale exacte sur des entiers non divisibles', async () => {
    const ctx = buildContext({
      individusReferentiel: {
        [REG_S.id]: REF_REG,
        [DEPT_A.id]: REF_DEPT,
        [DEPT_B.id]: REF_DEPT,
        [DEPT_C.id]: REF_DEPT,
      },
      enfantsParParent: { [REG_S.id]: [DEPT_A, DEPT_B, DEPT_C] },
      fonctionAgregationParReferentiel: { [REF_REG]: 'AVG' },
      serieFeuilleParIndividu: {
        [DEPT_A.id]: [saisie('2025-01-01', 1)],
        [DEPT_B.id]: [saisie('2025-01-01', 2)],
        [DEPT_C.id]: [saisie('2025-01-01', 2)],
      },
    })

    const serie = await resolveSerieIndividu(REG_S.id, ctx, new Map())

    // (1 + 2 + 2) / 3 = 1.6666...
    const valeur = (serie[0] as { valeur: Decimal }).valeur
    expect(valeur.toFixed(4)).toBe('1.6667')
  })
})

describe('resolveSerieIndividu — agrégation multi-niveaux', () => {
  it('agrège récursivement France (régions agrégées de départements)', async () => {
    const ctx = buildContext({
      individusReferentiel: {
        [FRANCE.id]: REF_PAYS,
        [REG_N.id]: REF_REG,
        [REG_S.id]: REF_REG,
        [DEPT_A.id]: REF_DEPT,
        [DEPT_B.id]: REF_DEPT,
        [DEPT_C.id]: REF_DEPT,
        [DEPT_D.id]: REF_DEPT,
      },
      enfantsParParent: {
        [FRANCE.id]: [REG_N, REG_S],
        [REG_N.id]: [DEPT_A, DEPT_B],
        [REG_S.id]: [DEPT_C, DEPT_D],
      },
      fonctionAgregationParReferentiel: { [REF_PAYS]: 'SUM', [REF_REG]: 'SUM' },
      serieFeuilleParIndividu: {
        [DEPT_A.id]: [saisie('2025-01-01', 1)],
        [DEPT_B.id]: [saisie('2025-01-01', 2)],
        [DEPT_C.id]: [saisie('2025-01-01', 10)],
        [DEPT_D.id]: [saisie('2025-01-01', 20)],
      },
    })

    const serie = await resolveSerieIndividu(FRANCE.id, ctx, new Map())

    expect(serie).toHaveLength(1)
    expect(serie[0]).toMatchObject({
      type: 'derivee',
      bucket: b('2025-01-01'),
      valeur: d(33),
      couverture: { nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 },
    })
    // Contributions France = régions, source = 'derivee'
    const contributions = (serie[0] as { contributions: { source: string; valeur: Decimal }[] })
      .contributions
    expect(contributions).toEqual([
      { individuPublicId: 'REG-N', valeur: d(3), dateOrigine: b('2025-01-01'), source: 'derivee' },
      { individuPublicId: 'REG-S', valeur: d(30), dateOrigine: b('2025-01-01'), source: 'derivee' },
    ])
  })

  it('propage le carry-forward à travers les niveaux', async () => {
    const ctx = buildContext({
      individusReferentiel: {
        [FRANCE.id]: REF_PAYS,
        [REG_N.id]: REF_REG,
        [REG_S.id]: REF_REG,
        [DEPT_A.id]: REF_DEPT,
        [DEPT_C.id]: REF_DEPT,
      },
      enfantsParParent: {
        [FRANCE.id]: [REG_N, REG_S],
        [REG_N.id]: [DEPT_A],
        [REG_S.id]: [DEPT_C],
      },
      fonctionAgregationParReferentiel: { [REF_PAYS]: 'SUM', [REF_REG]: 'SUM' },
      serieFeuilleParIndividu: {
        [DEPT_A.id]: [saisie('2025-01-01', 5)],
        [DEPT_C.id]: [saisie('2025-03-01', 50)],
      },
    })

    const serie = await resolveSerieIndividu(FRANCE.id, ctx, new Map())

    expect(serie).toHaveLength(2)
    // 2025-01 : REG-N = 5, REG-S inconnu → 5
    expect(serie[0]).toMatchObject({ bucket: b('2025-01-01'), valeur: d(5) })
    // 2025-03 : REG-N (carry-forward 5) + REG-S (50) → 55
    expect(serie[1]).toMatchObject({ bucket: b('2025-03-01'), valeur: d(55) })
  })
})

describe('resolveSerieIndividu — mémoïsation', () => {
  it('retourne la même référence pour un même individuId réinterrogé', async () => {
    const ctx = buildContext({
      individusReferentiel: { [DEPT_A.id]: REF_DEPT },
      serieFeuilleParIndividu: { [DEPT_A.id]: [saisie('2025-01-01', 7)] },
    })
    const cache = new Map<string, ReadonlyArray<PointInterne>>()

    const a = await resolveSerieIndividu(DEPT_A.id, ctx, cache)
    const b = await resolveSerieIndividu(DEPT_A.id, ctx, cache)
    expect(b).toBe(a)
  })

  it("partage la série d'un enfant entre deux appels parents distincts", async () => {
    const ctx = buildContext({
      individusReferentiel: {
        [FRANCE.id]: REF_PAYS,
        [REG_S.id]: REF_REG,
        [DEPT_A.id]: REF_DEPT,
      },
      enfantsParParent: {
        [FRANCE.id]: [REG_S],
        [REG_S.id]: [DEPT_A],
      },
      fonctionAgregationParReferentiel: { [REF_PAYS]: 'SUM', [REF_REG]: 'SUM' },
      serieFeuilleParIndividu: { [DEPT_A.id]: [saisie('2025-01-01', 12)] },
    })
    const cache = new Map<string, ReadonlyArray<PointInterne>>()

    await resolveSerieIndividu(REG_S.id, ctx, cache)
    const tailleAvant = cache.size

    await resolveSerieIndividu(FRANCE.id, ctx, cache)
    // Cache : REG_S et DEPT_A déjà présents avant l'appel FRANCE, qui n'ajoute que France.
    expect(cache.has(DEPT_A.id)).toBe(true)
    expect(cache.has(REG_S.id)).toBe(true)
    expect(cache.has(FRANCE.id)).toBe(true)
    expect(cache.size).toBe(tailleAvant + 1)
  })
})
