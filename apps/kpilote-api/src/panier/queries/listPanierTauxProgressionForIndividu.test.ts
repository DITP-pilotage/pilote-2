import { describe, expect, it } from 'vitest'

import { listPanierTauxProgressionForIndividu } from '@/panier/queries/listPanierTauxProgressionForIndividu'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testIndicateurId, testPanierId, testReferentielId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listPanierTauxProgressionForIndividu', () => {
  it(
    'retourne items vide quand aucun panier demandé',
    integrationTest(async () => {
      const deptId = testDeptId()
      await fixtures.individu({ publicId: deptId })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listPanierTauxProgressionForIndividu(deptId, { paniers: [] }),
      )

      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  it(
    'retourne tauxProgression null pour un panier sans indicateur',
    integrationTest(async () => {
      const deptId = testDeptId()
      const panId = testPanierId()
      await fixtures.individu({ publicId: deptId })
      await fixtures.panier({ publicId: panId, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listPanierTauxProgressionForIndividu(deptId, { paniers: [panId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ panier: panId, tauxProgression: null }],
      })
    }),
  )

  it(
    'calcule la moyenne arithmétique des taux quand tous les indicateurs sont calculables',
    integrationTest(async () => {
      const deptId = testDeptId()
      const refId = testReferentielId()
      const panId = testPanierId()
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
      await fixtures.panier({
        publicId: panId,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }, { publicId: indB }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listPanierTauxProgressionForIndividu(deptId, { paniers: [panId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ panier: panId, tauxProgression: 65 }],
      })
    }),
  )

  it(
    "retourne tauxProgression null si un indicateur n'a pas d'objectif (tout-ou-rien)",
    integrationTest(async () => {
      const deptId = testDeptId()
      const refId = testReferentielId()
      const panId = testPanierId()
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
      await fixtures.panier({
        publicId: panId,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indOk }, { publicId: indSansObjectif }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listPanierTauxProgressionForIndividu(deptId, { paniers: [panId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ panier: panId, tauxProgression: null }],
      })
    }),
  )

  it(
    "retourne tauxProgression null si un indicateur n'a aucune valeur",
    integrationTest(async () => {
      const deptId = testDeptId()
      const refId = testReferentielId()
      const panId = testPanierId()
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
      await fixtures.panier({
        publicId: panId,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indOk }, { publicId: indSansValeur }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listPanierTauxProgressionForIndividu(deptId, { paniers: [panId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ panier: panId, tauxProgression: null }],
      })
    }),
  )

  it(
    'retourne tauxProgression null quand valeurCible vaut zéro',
    integrationTest(async () => {
      const deptId = testDeptId()
      const refId = testReferentielId()
      const panId = testPanierId()
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
      await fixtures.panier({
        publicId: panId,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indId }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listPanierTauxProgressionForIndividu(deptId, { paniers: [panId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ panier: panId, tauxProgression: null }],
      })
    }),
  )

  it(
    'retient le dernier bucket pour le calcul',
    integrationTest(async () => {
      const deptId = testDeptId()
      const refId = testReferentielId()
      const panId = testPanierId()
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
      await fixtures.panier({
        publicId: panId,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indId }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listPanierTauxProgressionForIndividu(deptId, { paniers: [panId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ panier: panId, tauxProgression: 90 }],
      })
    }),
  )

  it(
    'lève une erreur si l individu est inconnu',
    integrationTest(async () => {
      const panId = testPanierId()
      await fixtures.panier({ publicId: panId, visibilite: 'PUBLIC' })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          listPanierTauxProgressionForIndividu('DEPT-INCONNU', { paniers: [panId] }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    'exclut silencieusement un panier PRIVE sans permission',
    integrationTest(async () => {
      const deptId = testDeptId()
      const panPublic = testPanierId()
      const panPrive = testPanierId()
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
      await fixtures.panier({
        publicId: panPublic,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indId }],
      })
      await fixtures.panier({ publicId: panPrive, visibilite: 'PRIVE' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listPanierTauxProgressionForIndividu(deptId, { paniers: [panPublic, panPrive] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(1)
      expect(items[0]).toEqual({ panier: panPublic, tauxProgression: 50 })
    }),
  )

  it(
    'retourne les taux corrects pour plusieurs paniers en un seul appel',
    integrationTest(async () => {
      const deptId = testDeptId()
      const refId = testReferentielId()
      const panA = testPanierId()
      const panB = testPanierId()
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
      await fixtures.panier({
        publicId: panA,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }],
      })
      await fixtures.panier({
        publicId: panB,
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indB }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listPanierTauxProgressionForIndividu(deptId, { paniers: [panA, panB] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(2)
      expect(items.find((i) => i.panier === panA)?.tauxProgression).toBe(40)
      expect(items.find((i) => i.panier === panB)?.tauxProgression).toBe(70)
    }),
  )
})
