import { type ValeurAvancementApiModel } from '@pilote/kpilote-shared/valeurAvancement'
import { describe, expect, it } from 'vitest'

import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { listObjectifsForIndicateur } from '@/objectifIndicateurIndividu/queries/listObjectifsForIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { listSyntheseIndividus } from '@/valeurAvancement/queries/listSyntheseIndividus'
import { listTauxProgressionForIndicateur } from '@/valeurAvancement/queries/listTauxProgressionForIndicateur'
import { listValeursForIndicateur } from '@/valeurAvancement/queries/listValeursForIndicateur'
import { listValeursRemarquablesForIndicateur } from '@/valeurAvancement/queries/listValeursRemarquablesForIndicateur'

// Lectures d'un indicateur multi-dimension Territoire × Opérateur (cf.
// dimensions-design.md §5.4 à §5.7). Le cube est décrit dans
// `fixtures.cubeTerritoireOperateur`.

type Cube = Awaited<ReturnType<typeof fixtures.cubeTerritoireOperateur>>

const saisir = async (
  cube: Cube,
  saisies: ReadonlyArray<[territoire: string, operateur: string, date: string, valeur: number]>,
) => {
  for (const [territoire, operateur, date, valeur] of saisies) {
    await fixtures.valeurAvancement({
      indicateur: { publicId: cube.indicateur },
      individus: [{ publicId: territoire }, { publicId: operateur }],
      date,
      valeur,
    })
  }
}

const lecteur = (cube: Cube) =>
  fixtures.apiKey({
    permissions: [
      { indicateur: { publicId: cube.indicateur }, action: IndicateurPermissionAction.READ },
    ],
  })

const point = (items: ValeurAvancementApiModel[], individu: string, date: string) => {
  const trouve = items.find((item) => item.individu === individu && item.date === date)
  if (!trouve) throw new Error(`Point absent : ${individu} @ ${date}`)
  if (trouve.type !== 'derivee') return trouve
  const contributions = [...trouve.contributions].sort((a, b) =>
    a.individu.localeCompare(b.individu),
  )
  return { ...trouve, contributions }
}

const serie = async (cube: Cube, principalId: string, individus: string[]) =>
  (
    await runAsPrincipal(principalId, () =>
      listValeursForIndicateur(cube.indicateur, { individus, dateTrunc: 'month' }),
    )
  )._unsafeUnwrap().items

describe.concurrent('lecture multi-dimension — agrégation des valeurs', () => {
  it(
    'cellule complète, marginale DEPT (tous opérateurs), REG et NAT en SUM',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await saisir(cube, [
        [cube.deptA, cube.orange, '2024-01-01', 10],
        [cube.deptA, cube.sfr, '2024-01-01', 20],
        [cube.deptB, cube.orange, '2024-01-01', 5],
        [cube.deptC, cube.free, '2024-01-01', 7],
      ])
      const apiKey = await lecteur(cube)

      const items = await serie(cube, apiKey.id, [
        `${cube.deptA}~${cube.orange}`,
        cube.deptA,
        cube.reg1,
        cube.nat,
      ])

      expect(point(items, `${cube.deptA}~${cube.orange}`, '2024-01-01')).toEqual({
        indicateur: cube.indicateur,
        individu: `${cube.deptA}~${cube.orange}`,
        date: '2024-01-01',
        valeur: 10,
        type: 'saisie',
      })
      expect(point(items, cube.deptA, '2024-01-01')).toEqual({
        indicateur: cube.indicateur,
        individu: cube.deptA,
        date: '2024-01-01',
        valeur: 30,
        type: 'derivee',
        fonctionAgregation: 'SUM',
        contributions: [
          {
            individu: `${cube.deptA}~${cube.orange}`,
            valeur: 10,
            date: '2024-01-01',
            source: 'saisie',
          },
          {
            individu: `${cube.deptA}~${cube.sfr}`,
            valeur: 20,
            date: '2024-01-01',
            source: 'saisie',
          },
        ].sort((a, b) => a.individu.localeCompare(b.individu)),
        couverture: { nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 },
      })
      expect(point(items, cube.reg1, '2024-01-01')).toMatchObject({
        valeur: 35,
        type: 'derivee',
        couverture: { nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 },
        contributions: [
          { individu: cube.deptA, valeur: 30, source: 'derivee' },
          { individu: cube.deptB, valeur: 5, source: 'derivee' },
        ].sort((a, b) => a.individu.localeCompare(b.individu)),
      })
      expect(point(items, cube.nat, '2024-01-01')).toMatchObject({
        valeur: 42,
        type: 'derivee',
        couverture: { nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 },
      })
    }),
  )

  it(
    'cube creux : un opérateur absent du département n’est pas attendu, un opérateur en retard l’est',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await saisir(cube, [
        [cube.deptB, cube.orange, '2024-01-01', 5],
        [cube.deptB, cube.sfr, '2024-02-01', 8],
        [cube.deptC, cube.free, '2024-01-01', 7],
      ])
      const apiKey = await lecteur(cube)

      const items = await serie(cube, apiKey.id, [cube.deptB, cube.deptC])

      // SFR a saisi sur DEPT-B (support sur tout l'historique) : attendu dès janvier.
      expect(point(items, cube.deptB, '2024-01-01')).toMatchObject({
        valeur: 5,
        couverture: { nbEnfantsAvecValeur: 1, nbEnfantsTotal: 2 },
        contributions: [
          { individu: `${cube.deptB}~${cube.orange}`, valeur: 5, source: 'saisie' },
          { individu: `${cube.deptB}~${cube.sfr}`, valeur: null, date: null, source: 'manquante' },
        ].sort((a, b) => a.individu.localeCompare(b.individu)),
      })
      expect(point(items, cube.deptB, '2024-02-01')).toMatchObject({
        valeur: 13,
        couverture: { nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 },
      })
      // Seul FREE opère sur DEPT-C : ORANGE et SFR ne comptent pas dans la couverture.
      expect(point(items, cube.deptC, '2024-01-01')).toMatchObject({
        valeur: 7,
        couverture: { nbEnfantsAvecValeur: 1, nbEnfantsTotal: 1 },
      })
    }),
  )

  it(
    'marginale territoriale d’un opérateur (racine virtuelle) : somme sur les territoires à support',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await saisir(cube, [
        [cube.deptA, cube.orange, '2024-01-01', 10],
        [cube.deptB, cube.orange, '2024-01-01', 5],
        [cube.deptC, cube.free, '2024-01-01', 7],
      ])
      const apiKey = await lecteur(cube)

      const items = await serie(cube, apiKey.id, [cube.orange, `${cube.reg2}~${cube.orange}`])

      expect(point(items, cube.orange, '2024-01-01')).toMatchObject({
        valeur: 15,
        type: 'derivee',
        couverture: { nbEnfantsAvecValeur: 1, nbEnfantsTotal: 1 },
        contributions: [{ individu: `${cube.nat}~${cube.orange}`, valeur: 15 }],
      })
      // Aucun support ORANGE sous REG-2 : feuille sans saisie, aucun point.
      expect(items.filter((item) => item.individu === `${cube.reg2}~${cube.orange}`)).toEqual([])
    }),
  )

  it(
    "AVG sur les deux dimensions : l'ordre de remontée change le résultat",
    integrationTest(async () => {
      const avg = { fonctionAgregation: 'AVG' as const }
      const territoireDabord = await fixtures.cubeTerritoireOperateur({
        fonctionNiveaux: 'AVG',
        territoire: { ...avg, ordre: 0 },
        operateur: { ...avg, ordre: 1 },
      })
      const operateurDabord = await fixtures.cubeTerritoireOperateur({
        fonctionNiveaux: 'AVG',
        territoire: { ...avg, ordre: 1 },
        operateur: { ...avg, ordre: 0 },
      })
      for (const cube of [territoireDabord, operateurDabord]) {
        await saisir(cube, [
          [cube.deptA, cube.orange, '2024-01-01', 10],
          [cube.deptA, cube.sfr, '2024-01-01', 20],
          [cube.deptB, cube.orange, '2024-01-01', 60],
        ])
      }
      const apiKey = await fixtures.apiKey({
        permissions: [territoireDabord, operateurDabord].map((cube) => ({
          indicateur: { publicId: cube.indicateur },
          action: IndicateurPermissionAction.READ,
        })),
      })

      // Territoire d'abord : AVG(AVG(10, 20), AVG(60)) = AVG(15, 60).
      const t = territoireDabord
      expect(point(await serie(t, apiKey.id, [t.reg1]), t.reg1, '2024-01-01')).toMatchObject({
        valeur: 37.5,
        fonctionAgregation: 'AVG',
        contributions: [
          { individu: t.deptA, valeur: 15 },
          { individu: t.deptB, valeur: 60 },
        ].sort((a, b) => a.individu.localeCompare(b.individu)),
      })
      // Opérateur d'abord : AVG(AVG(10, 60), AVG(20)) = AVG(35, 20). Les
      // contributions exposent le chemin (enfants de l'éclatement Opérateur).
      const o = operateurDabord
      expect(point(await serie(o, apiKey.id, [o.reg1]), o.reg1, '2024-01-01')).toMatchObject({
        valeur: 27.5,
        fonctionAgregation: 'AVG',
        contributions: [
          { individu: `${o.orange}~${o.reg1}`, valeur: 35 },
          { individu: `${o.sfr}~${o.reg1}`, valeur: 20 },
        ].sort((a, b) => a.individu.localeCompare(b.individu)),
      })
    }),
  )

  it(
    'fonctions mixtes : marginale Opérateur en AVG, niveaux territoriaux en SUM',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur({
        operateur: { fonctionAgregation: 'AVG' },
      })
      await saisir(cube, [
        [cube.deptA, cube.orange, '2024-01-01', 10],
        [cube.deptA, cube.sfr, '2024-01-01', 20],
        [cube.deptB, cube.orange, '2024-01-01', 60],
      ])
      const apiKey = await lecteur(cube)

      const items = await serie(cube, apiKey.id, [cube.deptA, cube.reg1])

      expect(point(items, cube.deptA, '2024-01-01')).toMatchObject({
        valeur: 15,
        fonctionAgregation: 'AVG',
      })
      expect(point(items, cube.reg1, '2024-01-01')).toMatchObject({
        valeur: 75,
        fonctionAgregation: 'SUM',
      })
    }),
  )

  it(
    'marginale NONE : la cellule partielle est une feuille dont on lit la saisie',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur({
        operateur: { fonctionAgregation: 'NONE' },
      })
      await saisir(cube, [[cube.deptA, cube.orange, '2024-01-01', 10]])
      await fixtures.valeurAvancement({
        indicateur: { publicId: cube.indicateur },
        individu: { publicId: cube.deptA },
        date: '2024-01-01',
        valeur: 99,
      })
      const apiKey = await lecteur(cube)

      const items = await serie(cube, apiKey.id, [cube.deptA])

      expect(items).toEqual([
        {
          indicateur: cube.indicateur,
          individu: cube.deptA,
          date: '2024-01-01',
          valeur: 99,
          type: 'saisie',
        },
      ])
    }),
  )
})

describe.concurrent('lecture multi-dimension — objectifs et taux de progression', () => {
  it(
    'objectifs à grain territorial : taux(DEPT) = Σ opérateurs / objectif(DEPT), taux(DEPT~OP) absent',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await saisir(cube, [
        [cube.deptA, cube.orange, '2024-01-01', 10],
        [cube.deptA, cube.sfr, '2024-01-01', 20],
      ])
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: cube.indicateur },
          individu: { publicId: cube.deptA },
          dateCible: '2024-12-01',
          valeurCible: 60,
        },
        {
          indicateur: { publicId: cube.indicateur },
          individu: { publicId: cube.deptB },
          dateCible: '2024-12-01',
          valeurCible: 40,
        },
      )
      const apiKey = await lecteur(cube)

      const result = await runAsPrincipal(apiKey.id, () =>
        listTauxProgressionForIndicateur(cube.indicateur, {
          individus: [cube.deptA, `${cube.deptA}~${cube.orange}`, cube.reg1],
        }),
      )

      expect(result._unsafeUnwrap().items).toEqual(
        [
          {
            indicateur: cube.indicateur,
            individu: cube.deptA,
            date: '2024-01-01',
            valeur: 30,
            valeurCible: 60,
            dateCible: '2024-12-01',
            tauxProgression: 50,
          },
          // REG-1 : valeur permissive (DEPT-B sans valeur), objectif strict 60 + 40.
          {
            indicateur: cube.indicateur,
            individu: cube.reg1,
            date: '2024-01-01',
            valeur: 30,
            valeurCible: 100,
            dateCible: '2024-12-01',
            tauxProgression: 30,
          },
        ].sort((a, b) => a.individu.localeCompare(b.individu)),
      )
    }),
  )

  it(
    'objectif dérivé strict : REG = Σ DEPT, NAT absent tant qu’un département manque',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: cube.indicateur },
          individu: { publicId: cube.deptA },
          dateCible: '2024-12-01',
          valeurCible: 60,
        },
        {
          indicateur: { publicId: cube.indicateur },
          individu: { publicId: cube.deptB },
          dateCible: '2024-12-01',
          valeurCible: 40,
        },
      )
      const apiKey = await lecteur(cube)

      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(cube.indicateur, {
          individus: [cube.reg1, cube.nat],
          dateTrunc: 'month',
        }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(1)
      expect(items[0]).toMatchObject({
        individu: cube.reg1,
        dateCible: '2024-12-01',
        valeurCible: 100,
        type: 'derivee',
        fonctionAgregation: 'SUM',
      })
    }),
  )
})

describe.concurrent('lecture multi-dimension — tranches et synthèse', () => {
  const peupler = async () => {
    const cube = await fixtures.cubeTerritoireOperateur()
    await saisir(cube, [
      [cube.deptA, cube.orange, '2024-01-01', 10],
      [cube.deptA, cube.sfr, '2024-01-01', 20],
      [cube.deptB, cube.orange, '2024-01-01', 5],
      [cube.deptC, cube.free, '2024-01-01', 7],
    ])
    const apiKey = await lecteur(cube)
    return { cube, apiKey }
  }

  it(
    'valeurs remarquables avec `fixe` : population = tranche « DEPT × OP-ORANGE »',
    integrationTest(async () => {
      const { cube, apiKey } = await peupler()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(cube.indicateur, {
          referentiels: [cube.refDept],
          fixe: cube.orange,
        }),
      )

      expect(result._unsafeUnwrap().items).toEqual([
        {
          referentiel: cube.refDept,
          min: 5,
          max: 10,
          mediane: 7.5,
          contributions: [
            {
              individu: `${cube.deptA}~${cube.orange}`,
              valeur: 10,
              date: '2024-01-01',
              source: 'saisie',
            },
            {
              individu: `${cube.deptB}~${cube.orange}`,
              valeur: 5,
              date: '2024-01-01',
              source: 'saisie',
            },
          ].sort((a, b) => a.individu.localeCompare(b.individu)),
        },
      ])
    }),
  )

  it(
    'valeurs remarquables sans `fixe` : population = marginales (tous opérateurs)',
    integrationTest(async () => {
      const { cube, apiKey } = await peupler()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(cube.indicateur, { referentiels: [cube.refDept] }),
      )

      expect(result._unsafeUnwrap().items).toMatchObject([
        { referentiel: cube.refDept, min: 5, max: 30, mediane: 7 },
      ])
    }),
  )

  it(
    'synthèse : les pairs font varier la première dimension présente (DEPT × OP-ORANGE)',
    integrationTest(async () => {
      const { cube, apiKey } = await peupler()

      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(cube.indicateur, {
          individus: [`${cube.deptA}~${cube.orange}`, cube.deptA],
        }),
      )

      // Pairs de DEPT-A~ORANGE : 10 et 5 (DEPT-C sans ORANGE) → médiane 7,5.
      // Pairs de DEPT-A : marginales 30, 5, 7 → médiane 7.
      expect(result._unsafeUnwrap().items).toEqual(
        [
          { individu: `${cube.deptA}~${cube.orange}`, variation: 10, ecartMediane: 2.5 },
          { individu: cube.deptA, variation: 30, ecartMediane: 23 },
        ].sort((a, b) => (a.individu < b.individu ? -1 : 1)),
      )
    }),
  )

  it(
    'synthèse : une cellule demandée dans un ordre non canonique compte parmi ses pairs',
    integrationTest(async () => {
      const { cube, apiKey } = await peupler()

      const result = await runAsPrincipal(apiKey.id, () =>
        listSyntheseIndividus(cube.indicateur, { individus: [`${cube.orange}~${cube.deptA}`] }),
      )

      expect(result._unsafeUnwrap().items).toEqual([
        { individu: `${cube.orange}~${cube.deptA}`, variation: 10, ecartMediane: 2.5 },
      ])
    }),
  )
})
