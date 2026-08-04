import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testDeptId,
  testDeptIds,
  testIndicateurId,
  testIndividuId,
  testReferentielId,
  testReferentielIds,
} from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { listValeursRemarquablesForIndicateur } from '@/valeurAvancement/queries/listValeursRemarquablesForIndicateur'

describe.concurrent('listValeursRemarquablesForIndicateur', () => {
  it(
    'retourne des stats null pour un référentiel sans individu',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.referentiel({ publicId: refId, nom: 'Vide' })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ referentiel: refId, min: null, max: null, mediane: null, contributions: [] }],
      })
    }),
  )

  it(
    "retourne des stats null pour un référentiel dont aucun individu n'a de valeur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.individu({
        publicId: deptId,
        referentiel: { publicId: refId, nom: 'A' },
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refId] }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ referentiel: refId, min: null, max: null, mediane: null, contributions: [] }],
      })
    }),
  )

  it(
    'calcule min/max/médiane sur la valeur la plus récente de chaque individu du référentiel',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const [dept1, dept2, dept3] = testDeptIds(3)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, nom: 'A', referentiel: { publicId: refId, nom: 'A' } },
          date: '2026-01-01',
          valeur: 100,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2026-02-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, nom: 'B', referentiel: { publicId: refId } },
          date: '2026-01-01',
          valeur: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept3, nom: 'C', referentiel: { publicId: refId } },
          date: '2026-01-01',
          valeur: 30,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refId] }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        items: [{ referentiel: refId, min: 10, max: 50, mediane: 30 }],
      })
    }),
  )

  it(
    'calcule la médiane comme moyenne des deux centrales (nombre pair)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const [dept1, dept2, dept3, dept4] = testDeptIds(4)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, nom: 'A', referentiel: { publicId: refId, nom: 'A' } },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, nom: 'B', referentiel: { publicId: refId } },
          date: '2026-01-01',
          valeur: 20,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept3, nom: 'C', referentiel: { publicId: refId } },
          date: '2026-01-01',
          valeur: 30,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept4, nom: 'D', referentiel: { publicId: refId } },
          date: '2026-01-01',
          valeur: 40,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refId] }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        items: [{ referentiel: refId, min: 10, max: 40, mediane: 25 }],
      })
    }),
  )

  it(
    "ignore les individus du référentiel n'ayant aucune valeur pour l'indicateur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.individu({
        publicId: dept1,
        nom: 'A',
        referentiel: { publicId: refId, nom: 'A' },
      })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: dept2, nom: 'B', referentiel: { publicId: refId } },
        date: '2026-01-01',
        valeur: 42,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refId] }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        items: [{ referentiel: refId, min: 42, max: 42, mediane: 42 }],
      })
    }),
  )

  it(
    'calcule des stats indépendantes pour chaque référentiel demandé',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [refA, refB] = testReferentielIds(2)
      const [dept1, dept2, dept3] = testDeptIds(3)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, nom: 'A', referentiel: { publicId: refA, nom: 'A' } },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, nom: 'B', referentiel: { publicId: refA } },
          date: '2026-01-01',
          valeur: 30,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept3, nom: 'C', referentiel: { publicId: refB, nom: 'B' } },
          date: '2026-01-01',
          valeur: 100,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refA, refB] }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        items: [
          { referentiel: refA, min: 10, max: 30, mediane: 20 },
          { referentiel: refB, min: 100, max: 100, mediane: 100 },
        ],
      })
    }),
  )

  it(
    'omet les référentiels inexistants',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const refInconnu = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptId, referentiel: { publicId: refId, nom: 'A' } },
        date: '2026-01-01',
        valeur: 42,
      })
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refId, refInconnu] }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        items: [{ referentiel: refId, min: 42, max: 42, mediane: 42 }],
      })
    }),
  )

  it(
    'trie les items par publicId de référentiel (asc)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [refFirst, refLast] = testReferentielIds(2)
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, referentiel: { publicId: refLast, nom: 'Z' } },
          date: '2026-01-01',
          valeur: 1,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, referentiel: { publicId: refFirst, nom: 'A' } },
          date: '2026-01-01',
          valeur: 2,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refLast, refFirst] }),
      )

      const items = result._unsafeUnwrap().items
      expect(items.map((i) => i.referentiel)).toEqual([refFirst, refLast])
    }),
  )

  it(
    'se base sur la date de la valeur, pas la date de saisie',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      const deptId = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId, referentiel: { publicId: refId, nom: 'A' } },
          date: '2026-02-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2026-03-01',
          valeur: 75,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2026-01-01',
          valeur: 50,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refId] }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        items: [{ referentiel: refId, min: 75, max: 75, mediane: 75 }],
      })
    }),
  )

  it(
    "ignore les valeurs d'autres indicateurs",
    integrationTest(async () => {
      const [indId, autreIndId] = [testIndicateurId(), testIndicateurId()]
      const refId = testReferentielId()
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, referentiel: { publicId: refId, nom: 'A' } },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, referentiel: { publicId: refId } },
          date: '2026-01-01',
          valeur: 20,
        },
        {
          indicateur: { publicId: autreIndId, nom: 'Autre' },
          individu: { publicId: dept1 },
          date: '2026-01-01',
          valeur: 9999,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refId] }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        items: [{ referentiel: refId, min: 10, max: 20, mediane: 15 }],
      })
    }),
  )

  it(
    'ignore les individus appartenant à un autre référentiel',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [refA, refB] = testReferentielIds(2)
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PUBLIC' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1, referentiel: { publicId: refA, nom: 'A' } },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, referentiel: { publicId: refB, nom: 'B' } },
          date: '2026-01-01',
          valeur: 9999,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refA] }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        items: [{ referentiel: refA, min: 10, max: 10, mediane: 10 }],
      })
    }),
  )

  it(
    "rejette quand l'indicateur est introuvable",
    integrationTest(async () => {
      const refId = testReferentielId()
      await fixtures.referentiel({ publicId: refId, nom: 'A' })
      const apiKey = await fixtures.apiKey()
      await expect(
        runAsPrincipal(apiKey.id, () =>
          listValeursRemarquablesForIndicateur(testIndicateurId(), { referentiels: [refId] }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    "rejette quand le principal n'a aucune permission sur un indicateur PRIVE",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PRIVE' })
      await fixtures.referentiel({ publicId: refId, nom: 'A' })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () =>
          listValeursRemarquablesForIndicateur(indId, { referentiels: [refId] }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    'calcule les stats sur les valeurs dérivées (SUM) des individus du référentiel',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      const [reg1, reg2] = [testIndividuId(), testIndividuId()]
      const [d1a, d1b, d2a, d2b] = [
        testIndividuId(),
        testIndividuId(),
        testIndividuId(),
        testIndividuId(),
      ]

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId, nom: 'T', visibilite: 'PUBLIC' },
          referentiel: { publicId: refReg, nom: 'Régions' },
          fonctionAgregation: 'SUM',
        },
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refDept, nom: 'Départements' },
          fonctionAgregation: 'NONE',
        },
      )
      await fixtures.relation(
        {
          parent: { publicId: reg1, referentiel: { publicId: refReg } },
          child: { publicId: d1a, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: reg1 },
          child: { publicId: d1b, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: reg2, referentiel: { publicId: refReg } },
          child: { publicId: d2a, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: reg2 },
          child: { publicId: d2b, referentiel: { publicId: refDept } },
        },
      )
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: d1a },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: d1b },
          date: '2026-01-01',
          valeur: 30,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: d2a },
          date: '2026-01-01',
          valeur: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: d2b },
          date: '2026-01-01',
          valeur: 70,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refReg] }),
      )

      // reg1 = 10+30 = 40 ; reg2 = 50+70 = 120
      expect(result._unsafeUnwrap()).toMatchObject({
        items: [{ referentiel: refReg, min: 40, max: 120, mediane: 80 }],
      })
    }),
  )

  it(
    'utilise le dernier bucket de la série dérivée (carry-forward des enfants)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      const regId = testIndividuId()
      const [dept1, dept2] = [testIndividuId(), testIndividuId()]

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId, nom: 'T', visibilite: 'PUBLIC' },
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
      // dept1 saisie en janvier, dept2 en mars. Dernier bucket de la série
      // région = mars, valeur = 7 (dept1, carry-forward) + 50 (dept2) = 57.
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2026-01-01',
          valeur: 7,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          date: '2026-03-01',
          valeur: 50,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refReg] }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        items: [{ referentiel: refReg, min: 57, max: 57, mediane: 57 }],
      })
    }),
  )

  it(
    'inclut un individu agrégé en couverture partielle (un seul enfant a saisi)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      const [reg1, reg2] = [testIndividuId(), testIndividuId()]
      const [d1a, d1b, d2a, d2b] = [
        testIndividuId(),
        testIndividuId(),
        testIndividuId(),
        testIndividuId(),
      ]

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId, nom: 'T', visibilite: 'PUBLIC' },
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
          parent: { publicId: reg1, referentiel: { publicId: refReg } },
          child: { publicId: d1a, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: reg1 },
          child: { publicId: d1b, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: reg2, referentiel: { publicId: refReg } },
          child: { publicId: d2a, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: reg2 },
          child: { publicId: d2b, referentiel: { publicId: refDept } },
        },
      )
      // reg1 : couverture pleine (d1a+d1b = 100). reg2 : un seul enfant saisi
      // (d2a = 5). reg2 contribue malgré la couverture partielle.
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: d1a },
          date: '2026-01-01',
          valeur: 40,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: d1b },
          date: '2026-01-01',
          valeur: 60,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: d2a },
          date: '2026-01-01',
          valeur: 5,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refReg] }),
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        items: [{ referentiel: refReg, min: 5, max: 100, mediane: 52.5 }],
      })
    }),
  )

  it(
    'calcule indépendamment un référentiel SUM et un référentiel feuille NONE',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      const regId = testIndividuId()
      const [dept1, dept2] = [testIndividuId(), testIndividuId()]

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId, nom: 'T', visibilite: 'PUBLIC' },
          referentiel: { publicId: refReg, nom: 'AAA-Régions' },
          fonctionAgregation: 'SUM',
        },
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refDept, nom: 'ZZZ-Départements' },
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
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2026-01-01',
          valeur: 12,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          date: '2026-01-01',
          valeur: 28,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refReg, refDept] }),
      )

      const items = result._unsafeUnwrap().items
      const parRef = new Map(items.map((i) => [i.referentiel, i]))
      // Feuille : min/max sur les saisies départementales.
      expect(parRef.get(refDept)).toMatchObject({
        referentiel: refDept,
        min: 12,
        max: 28,
        mediane: 20,
      })
      // Agrégé : dérivée région = 12 + 28 = 40 (un seul individu).
      expect(parRef.get(refReg)).toMatchObject({
        referentiel: refReg,
        min: 40,
        max: 40,
        mediane: 40,
      })
    }),
  )

  it(
    'expose les contributions par individu (saisie pour les feuilles, derivee pour les agrégés)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      const [regA, regB] = [testIndividuId(), testIndividuId()].sort() as [string, string]
      const [d1, d2, d3] = [testIndividuId(), testIndividuId(), testIndividuId()].sort() as [
        string,
        string,
        string,
      ]

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId, nom: 'T', visibilite: 'PUBLIC' },
          referentiel: { publicId: refReg, nom: 'R' },
          fonctionAgregation: 'SUM',
        },
        {
          indicateur: { publicId: indId },
          referentiel: { publicId: refDept, nom: 'D' },
          fonctionAgregation: 'NONE',
        },
      )
      await fixtures.relation(
        {
          parent: { publicId: regA, referentiel: { publicId: refReg } },
          child: { publicId: d1, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: regA },
          child: { publicId: d2, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: regB, referentiel: { publicId: refReg } },
          child: { publicId: d3, referentiel: { publicId: refDept } },
        },
      )
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: d1 },
          date: '2026-01-15',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: d2 },
          date: '2026-01-15',
          valeur: 20,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: d3 },
          date: '2026-02-20',
          valeur: 7,
        },
      )
      const apiKey = await fixtures.apiKey()

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refReg, refDept] }),
      )

      const items = result._unsafeUnwrap().items
      const reg = items.find((i) => i.referentiel === refReg)!
      const dept = items.find((i) => i.referentiel === refDept)!

      // Régions agrégées : sources = derivee, dates = buckets mensuels post-troncature.
      expect(reg.contributions).toEqual([
        { individu: regA, valeur: 30, date: '2026-01-01', source: 'derivee' },
        { individu: regB, valeur: 7, date: '2026-02-01', source: 'derivee' },
      ])
      // Départements feuilles : sources = saisie, dates = buckets mensuels (tri par publicId).
      expect(dept.contributions).toEqual([
        { individu: d1, valeur: 10, date: '2026-01-01', source: 'saisie' },
        { individu: d2, valeur: 20, date: '2026-01-01', source: 'saisie' },
        { individu: d3, valeur: 7, date: '2026-02-01', source: 'saisie' },
      ])
    }),
  )

  it(
    "autorise l'accès à un indicateur PRIVE quand le principal a la permission READ",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refId = testReferentielId()
      await fixtures.indicateur({ publicId: indId, nom: 'T', visibilite: 'PRIVE' })
      await fixtures.referentiel({ publicId: refId, nom: 'A' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: IndicateurPermissionAction.READ }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursRemarquablesForIndicateur(indId, { referentiels: [refId] }),
      )

      expect(result.isOk()).toBe(true)
    }),
  )
})
