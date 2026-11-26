import { groupBy, mapValues } from 'es-toolkit'
import { describe, expect, it } from 'vitest'

import { formatBucket, parseBucket } from '@/framework/bucket'
import { Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { getValeursTronqueesForIndividus } from '@/generated/prisma/sql'
import { loadIndividusByPublicId } from '@/indicateur/loadIndicateurIndividuContext'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testAxeId,
  testDeptId,
  testDeptIds,
  testIndicateurId,
  testModaliteId,
  testReferentielId,
  testReferentielIds,
  testRegId,
} from '@/test/randomIds'
import { keepLastPoints, loadResolveSerieContext } from '@/valeurAvancement/loadResolveSerieContext'
import { type PointInterne } from '@/valeurAvancement/resolveSerieNoeud'

// Résout les séries des cibles et rend un accès par publicId.
const resolveSeries = async ({
  indicateur,
  cibles,
  lastPointCount = null,
}: {
  indicateur: string
  cibles: ReadonlyArray<string>
  lastPointCount?: number | null
}): Promise<(publicId: string) => ReadonlyArray<PointInterne>> => {
  const { id: indicateurId } = await db().indicateur.findUniqueOrThrow({
    where: { publicId: indicateur },
  })
  const individusCibles = await loadIndividusByPublicId(cibles)
  const { serieOf } = await loadResolveSerieContext({
    indicateurId,
    individusCibles,
    dateTrunc: 'month',
    lastPointCount,
  })
  return (publicId) => {
    const cible = individusCibles.find((individu) => individu.publicId === publicId)
    if (!cible) throw new Error(`Cible inconnue : ${publicId}`)
    return serieOf(cible)
  }
}

const summarize = (serie: ReadonlyArray<PointInterne>) =>
  serie.map((point) => ({
    date: formatBucket(point.bucket),
    valeur: point.valeur.toNumber(),
    type: point.type,
  }))

// Une région qui somme deux départements, dont les saisies ne tombent pas les
// mêmes mois : chaque point de la région reporte la dernière valeur connue de
// l'autre département.
const regionAuxSaisiesDecalees = async () => {
  const indicateur = testIndicateurId()
  const [refReg, refDept] = testReferentielIds(2)
  const region = testRegId()
  const [deptA, deptB] = testDeptIds(2)
  await fixtures.indicateurReferentiel(
    {
      indicateur: { publicId: indicateur },
      referentiel: { publicId: refReg },
      fonctionAgregation: 'SUM',
    },
    {
      indicateur: { publicId: indicateur },
      referentiel: { publicId: refDept },
      fonctionAgregation: 'NONE',
    },
  )
  await fixtures.relation(
    {
      parent: { publicId: region, referentiel: { publicId: refReg } },
      child: { publicId: deptA, referentiel: { publicId: refDept } },
    },
    {
      parent: { publicId: region },
      child: { publicId: deptB, referentiel: { publicId: refDept } },
    },
  )
  const saisie = (individu: string, date: string, valeur: number) => ({
    indicateur: { publicId: indicateur },
    individu: { publicId: individu },
    date,
    valeur,
  })
  await fixtures.valeurAvancement(
    saisie(deptA, '2025-01-01', 10),
    saisie(deptA, '2025-02-01', 20),
    saisie(deptA, '2025-04-01', 40),
    saisie(deptB, '2025-01-01', 1),
    saisie(deptB, '2025-03-01', 3),
  )
  return { indicateur, region, deptA, deptB }
}

describe.concurrent('loadResolveSerieContext', () => {
  it(
    'calcule un individu agrégé à partir des saisies de ses enfants',
    integrationTest(async () => {
      const { indicateur, region } = await regionAuxSaisiesDecalees()

      const serieOf = await resolveSeries({ indicateur, cibles: [region] })

      expect(summarize(serieOf(region))).toEqual([
        { date: '2025-01-01', valeur: 11, type: 'derivee' },
        { date: '2025-02-01', valeur: 21, type: 'derivee' },
        { date: '2025-03-01', valeur: 23, type: 'derivee' },
        { date: '2025-04-01', valeur: 43, type: 'derivee' },
      ])
    }),
  )

  it(
    'avec lastPointCount, rend les derniers points de la série entière',
    integrationTest(async () => {
      const { indicateur, region } = await regionAuxSaisiesDecalees()
      const fullSerie = (await resolveSeries({ indicateur, cibles: [region] }))(region)

      const serieOfLastTwo = await resolveSeries({
        indicateur,
        cibles: [region],
        lastPointCount: 2,
      })
      const serieOfLastOne = await resolveSeries({
        indicateur,
        cibles: [region],
        lastPointCount: 1,
      })

      // Contributions et couverture comprises : le report lit la dernière
      // valeur de chaque enfant, même plus ancienne que les points gardés.
      expect(serieOfLastTwo(region)).toEqual(fullSerie.slice(-2))
      expect(serieOfLastOne(region)).toEqual(fullSerie.slice(-1))
    }),
  )

  it(
    'avec lastPointCount, rend le dernier point d’un indicateur à axes',
    integrationTest(async () => {
      const indicateur = testIndicateurId()
      const dept = testDeptId()
      const axe = { publicId: testAxeId() }
      const [ft, caf] = [testModaliteId(), testModaliteId()]
      await fixtures.modalite(
        { publicId: ft, nom: 'France Travail', niveau: { axe } },
        { publicId: caf, nom: 'CAF', niveau: { axe } },
      )
      await fixtures.indicateurAxe({ indicateur: { publicId: indicateur }, axe, fonction: 'SUM' })
      const saisie = (modalite: string, date: string, valeur: number) => ({
        indicateur: { publicId: indicateur },
        individu: {
          publicId: dept,
          referentiel: { publicId: testReferentielId(), nom: 'Départements' },
        },
        date,
        valeur,
        combinaison: { modalites: [{ publicId: modalite }] },
      })
      await fixtures.valeurAvancement(saisie(ft, '2025-01-01', 1))
      await fixtures.valeurAvancement(
        { ...saisie(ft, '2025-03-01', 3), individu: { publicId: dept } },
        { ...saisie(caf, '2025-02-01', 2), individu: { publicId: dept } },
      )
      const fullSerie = (await resolveSeries({ indicateur, cibles: [dept] }))(dept)

      const serieOfLastOne = await resolveSeries({ indicateur, cibles: [dept], lastPointCount: 1 })

      expect(summarize(fullSerie)).toEqual([
        { date: '2025-01-01', valeur: 1, type: 'derivee' },
        { date: '2025-02-01', valeur: 3, type: 'derivee' },
        { date: '2025-03-01', valeur: 5, type: 'derivee' },
      ])
      expect(serieOfLastOne(dept)).toEqual(fullSerie.slice(-1))
    }),
  )

  it(
    'lit les saisies d’un individu dont le référentiel n’agrège pas, sans ses enfants',
    integrationTest(async () => {
      const indicateur = testIndicateurId()
      const [refReg, refDept] = testReferentielIds(2)
      const region = testRegId()
      const dept = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indicateur },
        referentiel: { publicId: refReg },
        fonctionAgregation: 'NONE',
      })
      await fixtures.relation({
        parent: { publicId: region, referentiel: { publicId: refReg } },
        child: { publicId: dept, referentiel: { publicId: refDept } },
      })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indicateur },
          individu: { publicId: region },
          date: '2025-01-01',
          valeur: 99,
        },
        {
          indicateur: { publicId: indicateur },
          individu: { publicId: dept },
          date: '2025-01-01',
          valeur: 5,
        },
      )

      const serieOf = await resolveSeries({ indicateur, cibles: [region] })

      expect(summarize(serieOf(region))).toEqual([
        { date: '2025-01-01', valeur: 99, type: 'saisie' },
      ])
    }),
  )

  it(
    'garde la série d’un enfant demandé en même temps que son parent',
    integrationTest(async () => {
      const { indicateur, region, deptA } = await regionAuxSaisiesDecalees()

      const serieOf = await resolveSeries({ indicateur, cibles: [region, deptA] })

      expect(summarize(serieOf(deptA))).toEqual([
        { date: '2025-01-01', valeur: 10, type: 'saisie' },
        { date: '2025-02-01', valeur: 20, type: 'saisie' },
        { date: '2025-04-01', valeur: 40, type: 'saisie' },
      ])
      expect(summarize(serieOf(region)).at(-1)).toEqual({
        date: '2025-04-01',
        valeur: 43,
        type: 'derivee',
      })
    }),
  )

  it(
    'ne charge que les dernières saisies de chaque cellule quand lastPointCount est donné',
    integrationTest(async () => {
      const { indicateur, deptA, deptB } = await regionAuxSaisiesDecalees()
      const { id: indicateurId } = await db().indicateur.findUniqueOrThrow({
        where: { publicId: indicateur },
      })
      const individus = await loadIndividusByPublicId([deptA, deptB])
      const publicIdById = new Map(individus.map((individu) => [individu.id, individu.publicId]))

      const rows = await db().$queryRawTyped(
        getValeursTronqueesForIndividus(
          indicateurId,
          individus.map((individu) => individu.id),
          'month',
          null,
          2,
        ),
      )

      // Les deux dernières de chaque département, de la plus ancienne à la plus
      // récente : le moteur lit les saisies d'une cellule dans cet ordre.
      const bucketsByIndividu = mapValues(
        groupBy(rows, (row) => publicIdById.get(row.individuId) ?? ''),
        (saisies) => saisies.map((row) => row.bucket),
      )
      expect(bucketsByIndividu).toEqual({
        [deptA]: ['2025-02-01', '2025-04-01'],
        [deptB]: ['2025-01-01', '2025-03-01'],
      })
    }),
  )
})

describe.concurrent('keepLastPoints', () => {
  const serie = ['2026-01-01', '2026-02-01', '2026-03-01'].map((date): PointInterne => ({
    type: 'saisie',
    bucket: parseBucket(date),
    dateOrigine: parseBucket(date),
    valeur: new Decimal(1),
  }))

  it('rend les N derniers points', () => {
    expect(keepLastPoints({ serie, lastPointCount: 2 })).toEqual(serie.slice(1))
  })

  it('rend la série entière sans limite, ou quand on demande plus de points qu’elle n’en a', () => {
    expect(keepLastPoints({ serie, lastPointCount: null })).toEqual(serie)
    expect(keepLastPoints({ serie, lastPointCount: 5 })).toEqual(serie)
  })

  it('rend une série vide pour 0 point', () => {
    expect(keepLastPoints({ serie, lastPointCount: 0 })).toEqual([])
  })
})
