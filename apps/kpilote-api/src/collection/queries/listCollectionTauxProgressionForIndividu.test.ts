import { describe, expect, it } from 'vitest'

import { listCollectionTauxProgressionForIndividu } from '@/collection/queries/listCollectionTauxProgressionForIndividu'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testCollectionId, testIndicateurId, testReferentielId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listCollectionTauxProgressionForIndividu', () => {
  it(
    'retourne items vide quand aucune collection demandé',
    integrationTest(async () => {
      const deptId = testDeptId()
      await fixtures.individu({ publicId: deptId })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listCollectionTauxProgressionForIndividu(deptId, { collections: [] }),
      )

      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  it(
    'retourne tauxProgression null pour une collection sans indicateur',
    integrationTest(async () => {
      const deptId = testDeptId()
      const colId = testCollectionId()
      await fixtures.individu({ publicId: deptId })
      await fixtures.collection({ publicId: colId, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listCollectionTauxProgressionForIndividu(deptId, { collections: [colId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ collection: colId, tauxProgression: null }],
      })
    }),
  )

  it(
    'calcule la moyenne arithmétique des taux quand tous les indicateurs sont calculables',
    integrationTest(async () => {
      const deptId = testDeptId()
      const refId = testReferentielId()
      const colId = testCollectionId()
      const indA = testIndicateurId()
      const indB = testIndicateurId()

      await fixtures.indicateurReferentiel(
        { indicateur: { publicId: indA }, referentiel: { publicId: refId } },
        { indicateur: { publicId: indB }, referentiel: { publicId: refId } },
      )
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indA },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          date: '2024-06-01',
          valeur: 50,
        },
        {
          indicateur: { publicId: indB },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          date: '2024-06-01',
          valeur: 80,
        },
      )
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indA },
          individu: { publicId: deptId },
          dateCible: '2024-12-31',
          valeurCible: 100,
        },
        {
          indicateur: { publicId: indB },
          individu: { publicId: deptId },
          dateCible: '2024-12-31',
          valeurCible: 100,
        },
      )
      await fixtures.collection({
        publicId: colId,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }, { publicId: indB }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listCollectionTauxProgressionForIndividu(deptId, { collections: [colId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ collection: colId, tauxProgression: 65 }],
      })
    }),
  )

  it(
    "retourne tauxProgression null si un indicateur n'a pas d'objectif (tout-ou-rien)",
    integrationTest(async () => {
      const deptId = testDeptId()
      const refId = testReferentielId()
      const colId = testCollectionId()
      const indOk = testIndicateurId()
      const indSansObjectif = testIndicateurId()

      await fixtures.indicateurReferentiel(
        { indicateur: { publicId: indOk }, referentiel: { publicId: refId } },
        { indicateur: { publicId: indSansObjectif }, referentiel: { publicId: refId } },
      )
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indOk },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          date: '2024-06-01',
          valeur: 50,
        },
        {
          indicateur: { publicId: indSansObjectif },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          date: '2024-06-01',
          valeur: 30,
        },
      )
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indOk },
        individu: { publicId: deptId },
        dateCible: '2024-12-31',
        valeurCible: 100,
      })
      await fixtures.collection({
        publicId: colId,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indOk }, { publicId: indSansObjectif }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listCollectionTauxProgressionForIndividu(deptId, { collections: [colId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ collection: colId, tauxProgression: null }],
      })
    }),
  )

  it(
    "retourne tauxProgression null si un indicateur n'a aucune valeur",
    integrationTest(async () => {
      const deptId = testDeptId()
      const refId = testReferentielId()
      const colId = testCollectionId()
      const indOk = testIndicateurId()
      const indSansValeur = testIndicateurId()

      await fixtures.indicateurReferentiel(
        { indicateur: { publicId: indOk }, referentiel: { publicId: refId } },
        { indicateur: { publicId: indSansValeur }, referentiel: { publicId: refId } },
      )
      await fixtures.valeurAvancement({
        indicateur: { publicId: indOk },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-06-01',
        valeur: 50,
      })
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indOk },
          individu: { publicId: deptId },
          dateCible: '2024-12-31',
          valeurCible: 100,
        },
        {
          indicateur: { publicId: indSansValeur },
          individu: { publicId: deptId },
          dateCible: '2024-12-31',
          valeurCible: 100,
        },
      )
      await fixtures.collection({
        publicId: colId,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indOk }, { publicId: indSansValeur }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listCollectionTauxProgressionForIndividu(deptId, { collections: [colId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ collection: colId, tauxProgression: null }],
      })
    }),
  )

  it(
    'retourne tauxProgression null quand valeurCible vaut zéro',
    integrationTest(async () => {
      const deptId = testDeptId()
      const refId = testReferentielId()
      const colId = testCollectionId()
      const indId = testIndicateurId()

      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-06-01',
        valeur: 42,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        dateCible: '2024-12-31',
        valeurCible: 0,
      })
      await fixtures.collection({
        publicId: colId,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indId }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listCollectionTauxProgressionForIndividu(deptId, { collections: [colId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ collection: colId, tauxProgression: null }],
      })
    }),
  )

  it(
    'retient le dernier bucket pour le calcul',
    integrationTest(async () => {
      const deptId = testDeptId()
      const refId = testReferentielId()
      const colId = testCollectionId()
      const indId = testIndicateurId()

      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          date: '2024-03-01',
          valeur: 20,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          date: '2024-09-01',
          valeur: 90,
        },
      )
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        dateCible: '2024-12-31',
        valeurCible: 100,
      })
      await fixtures.collection({
        publicId: colId,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indId }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listCollectionTauxProgressionForIndividu(deptId, { collections: [colId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ collection: colId, tauxProgression: 90 }],
      })
    }),
  )

  it(
    'lève une erreur si l individu est inconnu',
    integrationTest(async () => {
      const colId = testCollectionId()
      await fixtures.collection({ publicId: colId, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          listCollectionTauxProgressionForIndividu('DEPT-INCONNU', { collections: [colId] }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    'exclut silencieusement une collection PRIVE sans permission',
    integrationTest(async () => {
      const deptId = testDeptId()
      const colPublic = testCollectionId()
      const colPrive = testCollectionId()
      const refId = testReferentielId()
      const indId = testIndicateurId()

      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-06-01',
        valeur: 50,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        dateCible: '2024-12-31',
        valeurCible: 100,
      })
      await fixtures.collection({
        publicId: colPublic,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indId }],
      })
      await fixtures.collection({ publicId: colPrive, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listCollectionTauxProgressionForIndividu(deptId, { collections: [colPublic, colPrive] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(1)
      expect(items[0]).toEqual({ collection: colPublic, tauxProgression: 50 })
    }),
  )

  it(
    'retourne les taux corrects pour plusieurs collections en un seul appel',
    integrationTest(async () => {
      const deptId = testDeptId()
      const refId = testReferentielId()
      const colA = testCollectionId()
      const colB = testCollectionId()
      const indA = testIndicateurId()
      const indB = testIndicateurId()

      await fixtures.indicateurReferentiel(
        { indicateur: { publicId: indA }, referentiel: { publicId: refId } },
        { indicateur: { publicId: indB }, referentiel: { publicId: refId } },
      )
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indA },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          date: '2024-06-01',
          valeur: 40,
        },
        {
          indicateur: { publicId: indB },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          date: '2024-06-01',
          valeur: 70,
        },
      )
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indA },
          individu: { publicId: deptId },
          dateCible: '2024-12-31',
          valeurCible: 100,
        },
        {
          indicateur: { publicId: indB },
          individu: { publicId: deptId },
          dateCible: '2024-12-31',
          valeurCible: 100,
        },
      )
      await fixtures.collection({
        publicId: colA,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }],
      })
      await fixtures.collection({
        publicId: colB,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indB }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listCollectionTauxProgressionForIndividu(deptId, { collections: [colA, colB] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(2)
      expect(items.find((i) => i.collection === colA)?.tauxProgression).toBe(40)
      expect(items.find((i) => i.collection === colB)?.tauxProgression).toBe(70)
    }),
  )
})
