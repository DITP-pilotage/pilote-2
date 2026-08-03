import { PermissionAction } from '@/generated/prisma/enums'
import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testDeptId,
  testDeptIds,
  testIndicateurId,
  testIndividuId,
  testReferentielId,
} from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { listValeursForIndicateur } from '@/valeurAvancement/queries/listValeursForIndicateur'

describe.concurrent('listValeursForIndicateur', () => {
  it(
    'retourne la série temporelle pour un seul individu (saisies)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'Test' },
          individu: { publicId: deptId, nom: 'Vaucluse' },
          date: '2024-01-01',
          valeur: 7.5,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2024-06-01',
          valeur: 7.8,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.READ }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursForIndicateur(indId, { individus: [deptId] }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items).toEqual([
        { indicateur: indId, individu: deptId, date: '2024-01-01', valeur: 7.5, type: 'saisie' },
        { indicateur: indId, individu: deptId, date: '2024-06-01', valeur: 7.8, type: 'saisie' },
      ])
    }),
  )

  it(
    'retourne le batch multi-individus',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2, dept3] = testDeptIds(3)
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: dept1, nom: 'Vaucluse' },
          date: '2024-01-01',
          valeur: 1,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, nom: 'Bouches-du-Rhône' },
          date: '2024-01-01',
          valeur: 2,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept3, nom: 'Alpes-Maritimes' },
          date: '2024-01-01',
          valeur: 3,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.READ }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursForIndicateur(indId, { individus: [dept1, dept2] }),
      )

      const value = result._unsafeUnwrap()
      const individus = value.items.map((v) => v.individu).sort()
      expect(individus).toEqual([dept1, dept2].sort())
      expect(value.items.find((v) => v.individu === dept3)).toBeUndefined()
      for (const item of value.items) expect(item.type).toBe('saisie')
    }),
  )

  it(
    'filtre par dateDebut et dateFin (inclusifs)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: deptId, nom: 'Vaucluse' },
          date: '2023-12-31',
          valeur: 1,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2024-01-01',
          valeur: 2,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2024-06-30',
          valeur: 3,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2024-07-01',
          valeur: 4,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.READ }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursForIndicateur(indId, {
          individus: [deptId],
          dateDebut: '2024-01-01',
          dateFin: '2024-06-30',
          dateTrunc: 'day',
        }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items.map((v) => v.date)).toEqual(['2024-01-01', '2024-06-30'])
    }),
  )

  it(
    'retourne une liste vide pour un individu sans valeur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T' })
      await fixtures.individu({ publicId: deptId, nom: 'Vaucluse' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.READ }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursForIndicateur(indId, { individus: [deptId] }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items).toEqual([])
    }),
  )

  it(
    "rejette quand l'indicateur est introuvable",
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      await expect(
        runAsPrincipal(apiKey.id, () =>
          listValeursForIndicateur(testIndicateurId(), { individus: [testDeptId()] }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    "rejette quand le principal n'a pas READ sur l'indicateur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId },
        individu: { publicId: deptId },
        date: '2024-01-01',
        valeur: 1,
      })
      const apiKey = await fixtures.apiKey()

      await expect(
        runAsPrincipal(apiKey.id, () => listValeursForIndicateur(indId, { individus: [deptId] })),
      ).rejects.toThrow()
    }),
  )

  it(
    'agrège un individu région à partir de ses départements (couverture complète)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      const regId = testIndividuId()
      const [dept1, dept2] = [testIndividuId(), testIndividuId()]

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId, nom: 'Arbres' },
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
          date: '2025-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          date: '2025-01-01',
          valeur: 20,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.READ }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursForIndicateur(indId, { individus: [regId] }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items).toHaveLength(1)
      const point = value.items[0]!
      expect(point).toMatchObject({
        indicateur: indId,
        individu: regId,
        date: '2025-01-01',
        valeur: 30,
        type: 'derivee',
        fonctionAgregation: 'SUM',
        couverture: { nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 },
      })
      if (point.type !== 'derivee') throw new Error('Expected derivee')
      expect(point.contributions.map((c) => c.individu).sort()).toEqual([dept1, dept2].sort())
    }),
  )

  it(
    'émet dès la première valeur connue et porte le carry-forward (combineLatest permissif)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      const regId = testIndividuId()
      const [dept1, dept2] = [testIndividuId(), testIndividuId()]

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId, nom: 'I' },
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
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2025-01-15',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          date: '2025-02-15',
          valeur: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2025-03-15',
          valeur: 30,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.READ }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursForIndicateur(indId, { individus: [regId], dateTrunc: 'day' }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items.map((v) => ({ date: v.date, valeur: v.valeur }))).toEqual([
        { date: '2025-01-15', valeur: 10 }, // dept1 seul → couverture 1/2
        { date: '2025-02-15', valeur: 60 }, // dept1 (carry 10) + dept2 (50) → 60
        { date: '2025-03-15', valeur: 80 }, // dept1 (30) + dept2 (carry 50) → 80
      ])
      const couvertures = value.items.map((v) => (v.type === 'derivee' ? v.couverture : null))
      expect(couvertures).toEqual([
        { nbEnfantsAvecValeur: 1, nbEnfantsTotal: 2 },
        { nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 },
        { nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 },
      ])
    }),
  )

  it(
    'agrège France à partir de régions agrégées de départements (multi-niveaux)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refPays = testReferentielId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      const franceId = testIndividuId()
      const [regN, regS] = [testIndividuId(), testIndividuId()]
      const [deptA, deptB, deptC, deptD] = [
        testIndividuId(),
        testIndividuId(),
        testIndividuId(),
        testIndividuId(),
      ]

      await fixtures.indicateurReferentiel(
        {
          indicateur: { publicId: indId, nom: 'I' },
          referentiel: { publicId: refPays },
          fonctionAgregation: 'SUM',
        },
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
          parent: { publicId: franceId, referentiel: { publicId: refPays } },
          child: { publicId: regN, referentiel: { publicId: refReg } },
        },
        {
          parent: { publicId: franceId },
          child: { publicId: regS, referentiel: { publicId: refReg } },
        },
        {
          parent: { publicId: regN },
          child: { publicId: deptA, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: regN },
          child: { publicId: deptB, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: regS },
          child: { publicId: deptC, referentiel: { publicId: refDept } },
        },
        {
          parent: { publicId: regS },
          child: { publicId: deptD, referentiel: { publicId: refDept } },
        },
      )
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptA },
          date: '2025-01-01',
          valeur: 1,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptB },
          date: '2025-01-01',
          valeur: 2,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptC },
          date: '2025-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptD },
          date: '2025-01-01',
          valeur: 20,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.READ }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursForIndicateur(indId, { individus: [franceId] }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items).toHaveLength(1)
      const point = value.items[0]!
      expect(point).toMatchObject({
        individu: franceId,
        date: '2025-01-01',
        valeur: 33,
        type: 'derivee',
        couverture: { nbEnfantsAvecValeur: 2, nbEnfantsTotal: 2 },
      })
      if (point.type !== 'derivee') throw new Error('Expected derivee')
      const contributionsParRegion = new Map(point.contributions.map((c) => [c.individu, c]))
      expect(contributionsParRegion.get(regN)).toMatchObject({ valeur: 3, source: 'derivee' })
      expect(contributionsParRegion.get(regS)).toMatchObject({ valeur: 30, source: 'derivee' })
      // contributions triées par publicId
      expect(point.contributions.map((c) => c.individu)).toEqual(
        [...point.contributions.map((c) => c.individu)].sort(),
      )
    }),
  )

  it(
    'applique dateTrunc=month et retient la saisie la plus récente du bucket',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId, nom: 'Vaucluse' },
          date: '2025-01-05',
          valeur: 1,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2025-01-18',
          valeur: 2,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2025-02-10',
          valeur: 5,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.READ }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursForIndicateur(indId, { individus: [deptId], dateTrunc: 'month' }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items).toEqual([
        { indicateur: indId, individu: deptId, date: '2025-01-01', valeur: 2, type: 'saisie' },
        { indicateur: indId, individu: deptId, date: '2025-02-01', valeur: 5, type: 'saisie' },
      ])
    }),
  )

  it(
    'traite un nœud avec enfants comme une feuille si fonctionAgregation = NONE',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      const regId = testIndividuId()
      const deptId = testIndividuId()

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
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: regId },
          date: '2025-01-01',
          valeur: 99,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2025-01-01',
          valeur: 7,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.READ }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursForIndicateur(indId, { individus: [regId] }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items).toEqual([
        { indicateur: indId, individu: regId, date: '2025-01-01', valeur: 99, type: 'saisie' },
      ])
    }),
  )

  it(
    'mixe saisies (feuille) et dérivées (agrégée) dans une même requête',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const refReg = testReferentielId()
      const refDept = testReferentielId()
      const regId = testIndividuId()
      const [dept1, dept2] = [testIndividuId(), testIndividuId()]

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
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2025-01-01',
          valeur: 5,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          date: '2025-01-01',
          valeur: 6,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: PermissionAction.READ }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursForIndicateur(indId, { individus: [regId, dept1] }),
      )

      const value = result._unsafeUnwrap()
      const sortedByIndividu = [...value.items].sort((a, b) => a.individu.localeCompare(b.individu))
      const types = sortedByIndividu.map((v) => ({ individu: v.individu, type: v.type }))
      expect(types).toContainEqual({ individu: dept1, type: 'saisie' })
      expect(types).toContainEqual({ individu: regId, type: 'derivee' })
    }),
  )
})
