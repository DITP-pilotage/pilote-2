import { describe, expect, it } from 'vitest'

import { ValidationError } from '@/framework/errors/AppError'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testDeptId,
  testDeptIds,
  testIndicateurId,
  testReferentielId,
  testRegId,
} from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { getValeurDerivee } from '@/valeurAvancement/queries/getValeurDerivee'

describe.concurrent('getValeurDerivee', () => {
  it(
    'retourne valeurDerivee null et couverture 0/0 pour une feuille (pas d’enfants)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      const refDept = testReferentielId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({
        publicId: deptId,
        referentiel: { publicId: refDept, nom: 'Dept' },
      })
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refDept },
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getValeurDerivee(indId, deptId))

      expect(result._unsafeUnwrap()).toEqual({
        indicateur: indId,
        individu: deptId,
        fonctionAgregation: 'SUM',
        valeurDerivee: null,
        contributions: [],
        couverture: { nbEnfantsAvecValeur: 0, nbEnfantsTotal: 0 },
      })
    }),
  )

  it(
    'somme les valeurs saisies des enfants directs (1 niveau, couverture complète)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const regId = testRegId()
      const [dept1, dept2] = testDeptIds(2)
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      await fixtures.relation(
        {
          parent: { publicId: regId, referentiel: { publicId: refReg, nom: 'Reg' } },
          child: { publicId: dept1, referentiel: { publicId: refDept, nom: 'Dept' } },
        },
        {
          parent: { publicId: regId },
          child: { publicId: dept2, referentiel: { publicId: refDept } },
        },
      )
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refReg },
      })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: dept1 },
          date: '2025-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          date: '2025-02-01',
          valeur: 20,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getValeurDerivee(indId, regId))

      const data = result._unsafeUnwrap()
      expect(data.valeurDerivee).toBe(30)
      expect(data.couverture).toEqual({ nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 })
      expect(data.contributions).toHaveLength(2)
      expect(data.contributions).toContainEqual({
        individu: dept1,
        valeur: 10,
        date: '2025-01-01',
        source: 'saisie',
      })
      expect(data.contributions).toContainEqual({
        individu: dept2,
        valeur: 20,
        date: '2025-02-01',
        source: 'saisie',
      })
    }),
  )

  it(
    'expose les enfants sans valeur comme `manquante` (couverture partielle)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const regId = testRegId()
      const [dept1, dept2, dept3] = testDeptIds(3)
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      await fixtures.relation(
        {
          parent: { publicId: regId, referentiel: { publicId: refReg, nom: 'Reg' } },
          child: { publicId: dept1, referentiel: { publicId: refDept, nom: 'Dept' } },
        },
        {
          parent: { publicId: regId },
          child: { publicId: dept2, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: regId },
          child: { publicId: dept3, referentiel: { publicId: refDept } },
        },
      )
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refReg },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId, nom: 'T' },
        individu: { publicId: dept1 },
        date: '2025-01-01',
        valeur: 100,
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getValeurDerivee(indId, regId))

      const data = result._unsafeUnwrap()
      expect(data.valeurDerivee).toBe(100)
      expect(data.couverture).toEqual({ nbEnfantsAvecValeur: 1, nbEnfantsTotal: 3 })
      expect(
        data.contributions.filter((contribution) => contribution.source === 'manquante'),
      ).toHaveLength(2)
    }),
  )

  it(
    'dérive le niveau intermédiaire à partir des feuilles (grand-parent, 2 niveaux)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const franceId = testRegId()
      const [regN, regS] = [testRegId(), testRegId()]
      const [deptN1, deptN2, deptS1, deptS2] = testDeptIds(4)
      const refPays = testReferentielId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()

      // France → 2 régions → chacune 2 départements (feuilles saisies)
      await fixtures.relation(
        {
          parent: { publicId: franceId, referentiel: { publicId: refPays, nom: 'Pays' } },
          child: { publicId: regN, referentiel: { publicId: refReg, nom: 'Reg' } },
        },
        {
          parent: { publicId: franceId },
          child: { publicId: regS, referentiel: { publicId: refReg } },
        },
        {
          parent: { publicId: regN },
          child: { publicId: deptN1, referentiel: { publicId: refDept, nom: 'Dept' } },
        },
        {
          parent: { publicId: regN },
          child: { publicId: deptN2, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: regS },
          child: { publicId: deptS1, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: regS },
          child: { publicId: deptS2, referentiel: { publicId: refDept } },
        },
      )
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refPays },
      })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: deptN1 },
          date: '2025-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptN2 },
          date: '2025-02-01',
          valeur: 20,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptS1 },
          date: '2025-03-01',
          valeur: 100,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptS2 },
          date: '2025-04-01',
          valeur: 200,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getValeurDerivee(indId, franceId))

      const data = result._unsafeUnwrap()
      expect(data.valeurDerivee).toBe(330)
      expect(data.couverture).toEqual({ nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 })
      // Les contributions de France sont les régions (source dérivée), pas les départements
      expect(data.contributions).toHaveLength(2)
      expect(data.contributions.every((contribution) => contribution.source === 'derivee')).toBe(
        true,
      )
      expect(data.contributions.map((contribution) => contribution.individu).sort()).toEqual(
        [regN, regS].sort(),
      )
    }),
  )

  it(
    'priorise la saisie sur un nœud intermédiaire (D1 : saisie ≻ dérivée pour la contribution au parent)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const franceId = testRegId()
      const reg = testRegId()
      const [dept1, dept2] = testDeptIds(2)
      const refPays = testReferentielId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      await fixtures.relation(
        {
          parent: { publicId: franceId, referentiel: { publicId: refPays, nom: 'Pays' } },
          child: { publicId: reg, referentiel: { publicId: refReg, nom: 'Reg' } },
        },
        {
          parent: { publicId: reg },
          child: { publicId: dept1, referentiel: { publicId: refDept, nom: 'Dept' } },
        },
        {
          parent: { publicId: reg },
          child: { publicId: dept2, referentiel: { publicId: refDept } },
        },
      )
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refPays },
      })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: reg }, // saisie officielle sur la région
          date: '2020-01-01',
          valeur: 999,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2025-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          date: '2025-02-01',
          valeur: 20,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => getValeurDerivee(indId, franceId))

      const data = result._unsafeUnwrap()
      expect(data.valeurDerivee).toBe(999)
      expect(data.contributions).toEqual([
        { individu: reg, valeur: 999, date: '2020-01-01', source: 'saisie' },
      ])
    }),
  )

  it(
    "throw quand l'indicateur n'est pas accessible (permission absente)",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      const refDept = testReferentielId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({
        publicId: deptId,
        referentiel: { publicId: refDept, nom: 'Dept' },
      })
      // apiKey sans permission sur indId
      const otherInd = testIndicateurId()
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: otherInd }, action: 'READ' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () => getValeurDerivee(indId, deptId)),
      ).rejects.toThrow()
    }),
  )

  it(
    "throw quand l'individu n'existe pas",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId, nom: 'T' }, action: 'READ' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () => getValeurDerivee(indId, testDeptId())),
      ).rejects.toThrow()
    }),
  )

  it(
    "rejette avec ValidationError quand l'indicateur n'est pas configuré pour le référentiel de l'individu",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      const refDept = testReferentielId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({
        publicId: deptId,
        referentiel: { publicId: refDept, nom: 'Dept' },
      })
      // Volontairement : aucun fixtures.indicateurReferentiel(...)
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () => getValeurDerivee(indId, deptId)),
      ).rejects.toMatchObject({
        constructor: ValidationError,
        message: expect.stringContaining("n'est pas configuré"),
      })
    }),
  )

  it(
    'rejette avec ValidationError quand fonctionAgregation vaut NONE',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      const refDept = testReferentielId()
      await fixtures.indicateur({ publicId: indId })
      await fixtures.individu({
        publicId: deptId,
        referentiel: { publicId: refDept, nom: 'Dept' },
      })
      await fixtures.indicateurReferentiel({
        indicateur: { publicId: indId },
        referentiel: { publicId: refDept },
        fonctionAgregation: 'NONE',
      })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      await expect(
        runAsPrincipal(apiKey.id, () => getValeurDerivee(indId, deptId)),
      ).rejects.toMatchObject({
        constructor: ValidationError,
        message: expect.stringContaining('NONE'),
      })
    }),
  )
})
