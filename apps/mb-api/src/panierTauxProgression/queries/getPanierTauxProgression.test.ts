import { describe, expect, it } from 'vitest'

import { getPanierTauxProgression } from '@/panierTauxProgression/queries/getPanierTauxProgression'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testDeptId,
  testIndicateurId,
  testReferentielId,
} from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('getPanierTauxProgression', () => {
  it(
    'retourne null avec contributions vides pour un panier vide',
    integrationTest(async () => {
      await fixtures.panier({
        publicId: 'PAN-PROG-EMPTY',
        visibilite: 'PUBLIC',
      })
      const deptId = testDeptId()
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        getPanierTauxProgression('PAN-PROG-EMPTY', { individu: deptId }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        panier: 'PAN-PROG-EMPTY',
        individu: deptId,
        tauxProgression: null,
        contributions: [],
      })
    }),
  )

  it(
    'calcule la moyenne arithmétique des derniers taux quand tous les indicateurs sont calculables',
    integrationTest(async () => {
      const refId = testReferentielId()
      const deptId = testDeptId()
      const indA = testIndicateurId()
      const indB = testIndicateurId()

      // Indicateur A : valeur 50 / cible 100 → 50 %
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indA },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indA },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-06-01',
        valeur: 50,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indA },
        individu: { publicId: deptId },
        dateCible: '2024-12-31',
        valeurCible: 100,
      })

      // Indicateur B : valeur 80 / cible 100 → 80 %
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indB },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indB },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-06-01',
        valeur: 80,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indB },
        individu: { publicId: deptId },
        dateCible: '2024-12-31',
        valeurCible: 100,
      })

      await fixtures.panier({
        publicId: 'PAN-PROG-OK',
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }, { publicId: indB }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        getPanierTauxProgression('PAN-PROG-OK', { individu: deptId }),
      )

      const data = result._unsafeUnwrap()
      expect(data.tauxProgression).toBe(65)
      expect(data.contributions).toEqual([
        { indicateur: indA, tauxProgression: 50, date: '2024-06-01', ponderation: 1 },
        { indicateur: indB, tauxProgression: 80, date: '2024-06-01', ponderation: 1 },
      ])
    }),
  )

  it(
    "retourne null si un indicateur n'a pas d'objectif (tout-ou-rien)",
    integrationTest(async () => {
      const refId = testReferentielId()
      const deptId = testDeptId()
      const indOk = testIndicateurId()
      const indSansObjectif = testIndicateurId()

      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indOk },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indOk },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-06-01',
        valeur: 50,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indOk },
        individu: { publicId: deptId },
        dateCible: '2024-12-31',
        valeurCible: 100,
      })

      // indSansObjectif a une valeur mais aucun objectif → non calculable
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indSansObjectif },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indSansObjectif },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-06-01',
        valeur: 30,
      })

      await fixtures.panier({
        publicId: 'PAN-PROG-NO-OBJ',
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indOk }, { publicId: indSansObjectif }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        getPanierTauxProgression('PAN-PROG-NO-OBJ', { individu: deptId }),
      )

      const data = result._unsafeUnwrap()
      expect(data.tauxProgression).toBeNull()
      expect(data.contributions).toEqual([
        { indicateur: indOk, tauxProgression: 50, date: '2024-06-01', ponderation: 1 },
        { indicateur: indSansObjectif, tauxProgression: null, date: null, ponderation: 1 },
      ])
    }),
  )

  it(
    "retourne null si un indicateur n'a aucune valeur",
    integrationTest(async () => {
      const refId = testReferentielId()
      const deptId = testDeptId()
      const indOk = testIndicateurId()
      const indSansValeur = testIndicateurId()

      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indOk },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indOk },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-06-01',
        valeur: 50,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indOk },
        individu: { publicId: deptId },
        dateCible: '2024-12-31',
        valeurCible: 100,
      })

      // indSansValeur : objectif uniquement, jamais de saisie
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indSansValeur },
        referentiel: { publicId: refId },
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indSansValeur },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        dateCible: '2024-12-31',
        valeurCible: 100,
      })

      await fixtures.panier({
        publicId: 'PAN-PROG-NO-VAL',
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indOk }, { publicId: indSansValeur }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        getPanierTauxProgression('PAN-PROG-NO-VAL', { individu: deptId }),
      )

      const data = result._unsafeUnwrap()
      expect(data.tauxProgression).toBeNull()
      expect(data.contributions[1]).toEqual({
        indicateur: indSansValeur,
        tauxProgression: null,
        date: null,
        ponderation: 1,
      })
    }),
  )

  it(
    'retourne null si le dernier point a valeurCible=0 (taux indicateur null)',
    integrationTest(async () => {
      const refId = testReferentielId()
      const deptId = testDeptId()
      const indZero = testIndicateurId()

      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indZero },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indZero },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-06-01',
        valeur: 42,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indZero },
        individu: { publicId: deptId },
        dateCible: '2024-12-31',
        valeurCible: 0,
      })

      await fixtures.panier({
        publicId: 'PAN-PROG-ZERO',
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indZero }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        getPanierTauxProgression('PAN-PROG-ZERO', { individu: deptId }),
      )

      const data = result._unsafeUnwrap()
      expect(data.tauxProgression).toBeNull()
      expect(data.contributions).toEqual([
        { indicateur: indZero, tauxProgression: null, date: '2024-06-01', ponderation: 1 },
      ])
    }),
  )

  it(
    "retient le dernier bucket (le plus récent) parmi plusieurs valeurs d'un indicateur",
    integrationTest(async () => {
      const refId = testReferentielId()
      const deptId = testDeptId()
      const indH = testIndicateurId()

      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indH },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indH },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          date: '2024-03-01',
          valeur: 20,
        },
        {
          indicateur: { publicId: indH },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          date: '2024-09-01',
          valeur: 90,
        },
      )
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indH },
        individu: { publicId: deptId },
        dateCible: '2024-12-31',
        valeurCible: 100,
      })

      await fixtures.panier({
        publicId: 'PAN-PROG-HIST',
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indH }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        getPanierTauxProgression('PAN-PROG-HIST', { individu: deptId }),
      )

      const data = result._unsafeUnwrap()
      expect(data.tauxProgression).toBe(90)
      expect(data.contributions[0]).toEqual({
        indicateur: indH,
        tauxProgression: 90,
        date: '2024-09-01',
        ponderation: 1,
      })
    }),
  )

  it(
    "retourne null avec contributions stub si l'individu est inconnu",
    integrationTest(async () => {
      const indA = testIndicateurId()
      await fixtures.indicateur({ publicId: indA })
      await fixtures.panier({
        publicId: 'PAN-PROG-INCONNU',
        visibilite: 'PUBLIC',
        indicateurs: [{ publicId: indA }],
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        getPanierTauxProgression('PAN-PROG-INCONNU', { individu: 'DEPT-INCONNU' }),
      )

      const data = result._unsafeUnwrap()
      expect(data.tauxProgression).toBeNull()
      expect(data.contributions).toEqual([
        { indicateur: indA, tauxProgression: null, date: null, ponderation: 1 },
      ])
    }),
  )

  it(
    'lève une erreur sur un panier PRIVE sans permission',
    integrationTest(async () => {
      await fixtures.panier({
        publicId: 'PAN-PROG-PRIV',
        visibilite: 'PRIVE',
      })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          getPanierTauxProgression('PAN-PROG-PRIV', { individu: testDeptId() }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    "autorise l'accès à un panier PRIVE avec permission READ",
    integrationTest(async () => {
      const refId = testReferentielId()
      const deptId = testDeptId()
      const indA = testIndicateurId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indA },
        referentiel: { publicId: refId },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indA },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        date: '2024-06-01',
        valeur: 25,
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indA },
        individu: { publicId: deptId },
        dateCible: '2024-12-31',
        valeurCible: 100,
      })
      await fixtures.panier({
        publicId: 'PAN-PROG-PRIV-OK',
        visibilite: 'PRIVE',
        indicateurs: [{ publicId: indA }],
      })
      const apiKey = await fixtures.apiKey({
        panierPermissions: [{ panier: { publicId: 'PAN-PROG-PRIV-OK' }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        getPanierTauxProgression('PAN-PROG-PRIV-OK', { individu: deptId }),
      )

      expect(result._unsafeUnwrap().tauxProgression).toBe(25)
    }),
  )
})
