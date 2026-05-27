import { describe, expect, it } from 'vitest'

import { listObjectifsForIndicateur } from '@/objectifIndicateurIndividu/queries/listObjectifsForIndicateur'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testDeptId,
  testDeptIds,
  testIndicateurId,
  testReferentielId,
  testReferentielIds,
  testRegId,
} from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

describe.concurrent('listObjectifsForIndicateur', () => {
  // ---------------------------------------------------------------------------
  // Cas de base (feuilles)
  // ---------------------------------------------------------------------------

  it(
    'retourne les objectifs pour un individu triés par dateCible',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          dateCible: '2025-01-01',
          valeurCible: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          dateCible: '2026-01-01',
          valeurCible: 100,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(indId, { individus: [deptId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            individu: deptId,
            dateCible: '2025-01-01',
            valeurCible: 50,
            type: 'saisie',
          },
          {
            indicateur: indId,
            individu: deptId,
            dateCible: '2026-01-01',
            valeurCible: 100,
            type: 'saisie',
          },
        ],
      })
    }),
  )

  it(
    'retourne les objectifs pour plusieurs individus',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, referentiel: { publicId: refId } },
          dateCible: '2025-01-01',
          valeurCible: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, referentiel: { publicId: refId } },
          dateCible: '2025-01-01',
          valeurCible: 80,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(indId, { individus: [dept1, dept2] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(2)
      const individus = items.map((i) => i.individu)
      expect(individus).toContain(dept1)
      expect(individus).toContain(dept2)
      expect(items.every((i) => i.type === 'saisie')).toBe(true)
    }),
  )

  it(
    "retourne une liste vide quand aucun objectif n'existe pour les individus demandés",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.individu({ publicId: deptId, referentiel: { publicId: refId } })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(indId, { individus: [deptId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  it(
    'ignore silencieusement les individus inconnus',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: deptId, referentiel: { publicId: refId } },
        dateCible: '2025-01-01',
        valeurCible: 50,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(indId, { individus: [deptId, 'DEPT-999'] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items).toHaveLength(1)
      expect(items[0]!.individu).toBe(deptId)
    }),
  )

  // ---------------------------------------------------------------------------
  // Bucketisation
  // ---------------------------------------------------------------------------

  it(
    'garde la dateCible la plus récente quand deux objectifs tombent dans le même bucket',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refId },
      })
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          dateCible: '2025-03-01',
          valeurCible: 40,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId, referentiel: { publicId: refId } },
          dateCible: '2025-11-01',
          valeurCible: 90,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      // dateTrunc=year → les deux tombent dans le bucket '2025-01-01', on retient le plus récent
      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(indId, { individus: [deptId], dateTrunc: 'year' }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            individu: deptId,
            dateCible: '2025-01-01',
            valeurCible: 90,
            type: 'saisie',
          },
        ],
      })
    }),
  )

  // ---------------------------------------------------------------------------
  // Agrégation SUM
  // ---------------------------------------------------------------------------

  it(
    'dérive un objectif SUM quand tous les enfants ont un objectif sur le même bucket',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [refReg, refDept] = testReferentielIds(2)
      const regId = testRegId()
      const [dept1, dept2] = testDeptIds(2)

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refReg },
          fonctionAgregation: 'SUM',
        },
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refDept },
          fonctionAgregation: 'NONE',
        },
      )
      await fixtures.relation(
        {
          parent: { publicId: regId, referentiel: { publicId: refReg } },
          child: { publicId: dept1, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: regId },
          child: { publicId: dept2, referentiel: { publicId: refDept } },
        },
      )
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          dateCible: '2025-01-01',
          valeurCible: 30,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          dateCible: '2025-01-01',
          valeurCible: 70,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(indId, { individus: [regId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            individu: regId,
            dateCible: '2025-01-01',
            valeurCible: 100,
            type: 'derivee',
          },
        ],
      })
    }),
  )

  it(
    'dérive un objectif AVG quand tous les enfants ont un objectif',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [refReg, refDept] = testReferentielIds(2)
      const regId = testRegId()
      const [dept1, dept2] = testDeptIds(2)

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refReg },
          fonctionAgregation: 'AVG',
        },
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refDept },
          fonctionAgregation: 'NONE',
        },
      )
      await fixtures.relation(
        {
          parent: { publicId: regId, referentiel: { publicId: refReg } },
          child: { publicId: dept1, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: regId },
          child: { publicId: dept2, referentiel: { publicId: refDept } },
        },
      )
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          dateCible: '2025-01-01',
          valeurCible: 40,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          dateCible: '2025-01-01',
          valeurCible: 80,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(indId, { individus: [regId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            individu: regId,
            dateCible: '2025-01-01',
            valeurCible: 60,
            type: 'derivee',
          },
        ],
      })
    }),
  )

  // ---------------------------------------------------------------------------
  // Carry-forward strict
  // ---------------------------------------------------------------------------

  it(
    'porte le dernier objectif enfant connu sur les buckets suivants (carry-forward)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [refReg, refDept] = testReferentielIds(2)
      const regId = testRegId()
      const [dept1, dept2] = testDeptIds(2)

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refReg },
          fonctionAgregation: 'SUM',
        },
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refDept },
          fonctionAgregation: 'NONE',
        },
      )
      await fixtures.relation(
        {
          parent: { publicId: regId, referentiel: { publicId: refReg } },
          child: { publicId: dept1, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: regId },
          child: { publicId: dept2, referentiel: { publicId: refDept } },
        },
      )
      // dept1 a un objectif en 2024, dept2 en 2025
      // Pour le bucket 2025 : dept1 porte son objectif 2024 → SUM = 50 + 80 = 130
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          dateCible: '2024-01-01',
          valeurCible: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          dateCible: '2025-01-01',
          valeurCible: 80,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(indId, { individus: [regId] }),
      )

      // Bucket 2024 : dept2 n'a pas encore de valeur → strict → pas de point
      // Bucket 2025 : dept1 porte 50 depuis 2024, dept2 a 80 → SUM = 130
      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            individu: regId,
            dateCible: '2025-01-01',
            valeurCible: 130,
            type: 'derivee',
          },
        ],
      })
    }),
  )

  it(
    "n'émet aucun objectif dérivé tant qu'un enfant n'a pas encore de valeur portée (strict)",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [refReg, refDept] = testReferentielIds(2)
      const regId = testRegId()
      const [dept1, dept2] = testDeptIds(2)

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refReg },
          fonctionAgregation: 'SUM',
        },
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refDept },
          fonctionAgregation: 'NONE',
        },
      )
      await fixtures.relation(
        {
          parent: { publicId: regId, referentiel: { publicId: refReg } },
          child: { publicId: dept1, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: regId },
          child: { publicId: dept2, referentiel: { publicId: refDept } },
        },
      )
      // dept2 n'a aucun objectif → le parent ne peut jamais être calculé
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: dept1 },
        dateCible: '2025-01-01',
        valeurCible: 50,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(indId, { individus: [regId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  // ---------------------------------------------------------------------------
  // NONE = feuille même avec enfants
  // ---------------------------------------------------------------------------

  it(
    "traite un individu avec fonctionAgregation NONE comme feuille même s'il a des enfants",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [refReg, refDept] = testReferentielIds(2)
      const regId = testRegId()
      const deptId = testDeptId()

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refReg },
          fonctionAgregation: 'NONE',
        },
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refDept },
          fonctionAgregation: 'NONE',
        },
      )
      await fixtures.relation({
        parent: { publicId: regId, referentiel: { publicId: refReg } },
        child: { publicId: deptId, referentiel: { publicId: refDept } },
      })
      await fixtures.objectifIndicateurIndividu({
        indicateur: { publicId: indId },
        individu: { publicId: regId },
        dateCible: '2025-01-01',
        valeurCible: 200,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(indId, { individus: [regId] }),
      )

      // La région lit sa propre saisie, non les enfants
      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            individu: regId,
            dateCible: '2025-01-01',
            valeurCible: 200,
            type: 'saisie',
          },
        ],
      })
    }),
  )

  // ---------------------------------------------------------------------------
  // Saisie directe ignorée pour un parent agrégé
  // ---------------------------------------------------------------------------

  it(
    "ignore la saisie directe d'un parent agrégé et retourne uniquement le dérivé",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [refReg, refDept] = testReferentielIds(2)
      const regId = testRegId()
      const deptId = testDeptId()

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refReg },
          fonctionAgregation: 'SUM',
        },
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refDept },
          fonctionAgregation: 'NONE',
        },
      )
      await fixtures.relation({
        parent: { publicId: regId, referentiel: { publicId: refReg } },
        child: { publicId: deptId, referentiel: { publicId: refDept } },
      })
      // Saisie directe sur la région + saisie sur l'enfant
      await fixtures.objectifIndicateurIndividu(
        {
          indicateur: { publicId: indId },
          individu: { publicId: regId },
          dateCible: '2025-01-01',
          valeurCible: 999,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          dateCible: '2025-01-01',
          valeurCible: 60,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listObjectifsForIndicateur(indId, { individus: [regId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            indicateur: indId,
            individu: regId,
            dateCible: '2025-01-01',
            valeurCible: 60,
            type: 'derivee',
          },
        ],
      })
    }),
  )
})
