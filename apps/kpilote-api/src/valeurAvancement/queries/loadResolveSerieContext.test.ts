import { describe, expect, it } from 'vitest'

import { formatBucket } from '@/framework/bucket'
import { db } from '@/framework/persistence/dbStore'
import { loadIndividusParPublicId } from '@/indicateur/queries/loadIndicateurIndividuContext'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testDeptId,
  testDeptIds,
  testIndicateurId,
  testIndividuId,
  testReferentielIds,
  testRegId,
  testRegIds,
} from '@/test/randomIds'
import { loadResolveSerieContext } from '@/valeurAvancement/queries/loadResolveSerieContext'
import { type PointInterne } from '@/valeurAvancement/resolveSerieNoeud'

// Résout les séries des cibles et rend un accès par publicId.
const resolveSeries = async ({
  indicateur,
  cibles,
}: {
  indicateur: string
  cibles: ReadonlyArray<string>
}): Promise<(publicId: string) => ReadonlyArray<PointInterne>> => {
  const { id: indicateurId } = await db().indicateur.findUniqueOrThrow({
    where: { publicId: indicateur },
  })
  const individusCibles = await loadIndividusParPublicId(cibles)
  const { serieDe } = await loadResolveSerieContext({
    indicateurId,
    individusCibles,
    dateTrunc: 'month',
  })
  return (publicId) => {
    const cible = individusCibles.find((individu) => individu.publicId === publicId)
    if (!cible) throw new Error(`Cible inconnue : ${publicId}`)
    return serieDe(cible)
  }
}

const resume = (serie: ReadonlyArray<PointInterne>) =>
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

      const serieDe = await resolveSeries({ indicateur, cibles: [region] })

      expect(resume(serieDe(region))).toEqual([
        { date: '2025-01-01', valeur: 11, type: 'derivee' },
        { date: '2025-02-01', valeur: 21, type: 'derivee' },
        { date: '2025-03-01', valeur: 23, type: 'derivee' },
        { date: '2025-04-01', valeur: 43, type: 'derivee' },
      ])
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

      const serieDe = await resolveSeries({ indicateur, cibles: [region] })

      expect(resume(serieDe(region))).toEqual([{ date: '2025-01-01', valeur: 99, type: 'saisie' }])
    }),
  )

  it(
    'garde la série d’un enfant demandé en même temps que son parent',
    integrationTest(async () => {
      const { indicateur, region, deptA } = await regionAuxSaisiesDecalees()

      const serieDe = await resolveSeries({ indicateur, cibles: [region, deptA] })

      expect(resume(serieDe(deptA))).toEqual([
        { date: '2025-01-01', valeur: 10, type: 'saisie' },
        { date: '2025-02-01', valeur: 20, type: 'saisie' },
        { date: '2025-04-01', valeur: 40, type: 'saisie' },
      ])
      expect(resume(serieDe(region)).at(-1)).toEqual({
        date: '2025-04-01',
        valeur: 43,
        type: 'derivee',
      })
    }),
  )

  it(
    'résout un individu agrégé rattaché à deux parents',
    integrationTest(async () => {
      const indicateur = testIndicateurId()
      const [refParent, refIntermediaire, refFeuille] = testReferentielIds(3)
      const [parentA, parentB] = testRegIds(2)
      const intermediaire = testIndividuId()
      const feuille = testDeptId()
      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indicateur },
          referentiel: { publicId: refParent },
          fonctionAgregation: 'SUM',
        },
        {
          indicateur: { publicId: indicateur },
          referentiel: { publicId: refIntermediaire },
          fonctionAgregation: 'SUM',
        },
      )
      await fixtures.relation(
        {
          parent: { publicId: parentA, referentiel: { publicId: refParent } },
          child: { publicId: intermediaire, referentiel: { publicId: refIntermediaire } },
        },
        {
          parent: { publicId: parentB, referentiel: { publicId: refParent } },
          child: { publicId: intermediaire },
        },
        {
          parent: { publicId: intermediaire },
          child: { publicId: feuille, referentiel: { publicId: refFeuille } },
        },
      )
      await fixtures.valeurAvancement({
        indicateur: { publicId: indicateur },
        individu: { publicId: feuille },
        date: '2025-01-01',
        valeur: 7,
      })

      const serieDe = await resolveSeries({ indicateur, cibles: [parentA, parentB] })

      // L'intermédiaire n'est pas demandé : oublié après le premier parent, il
      // est recalculé pour le second.
      const attendu = [{ date: '2025-01-01', valeur: 7, type: 'derivee' }]
      expect(resume(serieDe(parentA))).toEqual(attendu)
      expect(resume(serieDe(parentB))).toEqual(attendu)
    }),
  )
})
