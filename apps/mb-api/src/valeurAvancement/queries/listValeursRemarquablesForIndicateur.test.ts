import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testDeptIds, testIndicateurId } from '@/test/randomIds'
import { listValeursRemarquablesForIndicateur } from '@/valeurAvancement/queries/listValeursRemarquablesForIndicateur'

describe.concurrent('listValeursRemarquablesForIndicateur', () => {
  it(
    'retourne variation = null et stats à null pour un individu sans valeur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T' })
      await fixtures.individu({ publicId: deptId, nom: 'Vaucluse' })

      const result = await listValeursRemarquablesForIndicateur(indId, { individus: [deptId] })

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: null }],
        min: null,
        max: null,
        mediane: null,
      })
    }),
  )

  it(
    "retourne variation = valeur lorsqu'il n'y a qu'une seule valeur",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId, nom: 'T' },
        individu: { publicId: deptId, nom: 'Vaucluse' },
        date: '2026-01-01',
        valeur: 50,
      })

      const result = await listValeursRemarquablesForIndicateur(indId, { individus: [deptId] })

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: 50 }],
        min: 50,
        max: 50,
        mediane: 50,
      })
    }),
  )

  it(
    'retourne la variation entre les deux valeurs les plus récentes (positive)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: deptId, nom: 'Vaucluse' },
          date: '2026-01-01',
          valeur: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2026-02-01',
          valeur: 25,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2026-03-01',
          valeur: 75,
        },
      )

      const result = await listValeursRemarquablesForIndicateur(indId, { individus: [deptId] })

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: 50 }],
        min: 75,
        max: 75,
        mediane: 75,
      })
    }),
  )

  it(
    'retourne la variation entre les deux valeurs les plus récentes (négative)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: deptId, nom: 'Vaucluse' },
          date: '2026-01-01',
          valeur: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2026-02-01',
          valeur: 25,
        },
      )

      const result = await listValeursRemarquablesForIndicateur(indId, { individus: [deptId] })

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: -25 }],
        min: 25,
        max: 25,
        mediane: 25,
      })
    }),
  )

  it(
    "se base sur la date de la valeur, pas la date de saisie (ordre d'insertion non pertinent)",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      // Insérée en dernier mais avec une date antérieure → ne doit pas influencer l'affichage
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: deptId, nom: 'Vaucluse' },
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

      const result = await listValeursRemarquablesForIndicateur(indId, { individus: [deptId] })

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: 65 }],
        min: 75,
        max: 75,
        mediane: 75,
      })
    }),
  )

  it(
    'retourne un item par individu existant, triés par publicId',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2, dept3] = testDeptIds(3)
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: dept1, nom: 'A' },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2026-02-01',
          valeur: 30,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, nom: 'B' },
          date: '2026-01-01',
          valeur: 5,
        },
      )
      // dept3 sans valeur mais existe
      await fixtures.individu({ publicId: dept3, nom: 'C' })

      const result = await listValeursRemarquablesForIndicateur(indId, {
        individus: [dept3, dept1, dept2],
      })

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          { individu: dept1, variation: 20 },
          { individu: dept2, variation: 5 },
          { individu: dept3, variation: null },
        ],
        min: 5,
        max: 30,
        mediane: 17.5,
      })
    }),
  )

  it(
    "ignore les valeurs d'autres indicateurs",
    integrationTest(async () => {
      const [indId, autreIndId] = [testIndicateurId(), testIndicateurId()]
      const deptId = testDeptId()
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: deptId, nom: 'Vaucluse' },
          date: '2026-01-01',
          valeur: 100,
        },
        {
          indicateur: { publicId: autreIndId, nom: 'Autre' },
          individu: { publicId: deptId },
          date: '2026-02-01',
          valeur: 9999,
        },
      )

      const result = await listValeursRemarquablesForIndicateur(indId, { individus: [deptId] })

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: 100 }],
        min: 100,
        max: 100,
        mediane: 100,
      })
    }),
  )

  it(
    'omet les individus inexistants',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      const inconnu = testDeptId()
      await fixtures.valeurAvancement({
        indicateur: { publicId: indId, nom: 'T' },
        individu: { publicId: deptId, nom: 'Vaucluse' },
        date: '2026-01-01',
        valeur: 42,
      })

      const result = await listValeursRemarquablesForIndicateur(indId, {
        individus: [deptId, inconnu],
      })

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: 42 }],
        min: 42,
        max: 42,
        mediane: 42,
      })
    }),
  )

  it(
    'évite les erreurs de précision IEEE 754 sur la soustraction de décimaux',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: deptId, nom: 'Vaucluse' },
          date: '2026-01-01',
          valeur: 0.15,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: deptId },
          date: '2026-02-01',
          valeur: 0.3,
        },
      )

      const result = await listValeursRemarquablesForIndicateur(indId, { individus: [deptId] })

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: 0.15 }],
        min: 0.3,
        max: 0.3,
        mediane: 0.3,
      })
    }),
  )

  it(
    'calcule min/max/médiane sur la valeur la plus récente de chaque individu (nombre impair)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2, dept3] = testDeptIds(3)
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: dept1, nom: 'A' },
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
          individu: { publicId: dept2, nom: 'B' },
          date: '2026-01-01',
          valeur: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept3, nom: 'C' },
          date: '2026-01-01',
          valeur: 30,
        },
      )

      const result = await listValeursRemarquablesForIndicateur(indId, { individus: [dept1] })

      // Valeurs récentes: dept1=10, dept2=50, dept3=30
      expect(result._unsafeUnwrap()).toMatchObject({
        min: 10,
        max: 50,
        mediane: 30,
      })
    }),
  )

  it(
    'calcule la médiane comme moyenne des deux centrales (nombre pair)',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2, dept3, dept4] = testDeptIds(4)
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: dept1, nom: 'A' },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, nom: 'B' },
          date: '2026-01-01',
          valeur: 20,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept3, nom: 'C' },
          date: '2026-01-01',
          valeur: 30,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept4, nom: 'D' },
          date: '2026-01-01',
          valeur: 40,
        },
      )

      const result = await listValeursRemarquablesForIndicateur(indId, { individus: [dept1] })

      expect(result._unsafeUnwrap()).toMatchObject({
        min: 10,
        max: 40,
        mediane: 25,
      })
    }),
  )

  it(
    "min/max/médiane sont calculés sur tous les individus de l'indicateur, pas seulement ceux demandés",
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2, dept3] = testDeptIds(3)
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: dept1, nom: 'A' },
          date: '2026-01-01',
          valeur: 5,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, nom: 'B' },
          date: '2026-01-01',
          valeur: 50,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept3, nom: 'C' },
          date: '2026-01-01',
          valeur: 100,
        },
      )

      // Ne demande qu'un seul individu mais les stats portent sur les 3
      const result = await listValeursRemarquablesForIndicateur(indId, { individus: [dept2] })

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: dept2, variation: 50 }],
        min: 5,
        max: 100,
        mediane: 50,
      })
    }),
  )

  it(
    "min/max/médiane ignorent les valeurs d'autres indicateurs",
    integrationTest(async () => {
      const [indId, autreIndId] = [testIndicateurId(), testIndicateurId()]
      const [dept1, dept2] = testDeptIds(2)
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: dept1, nom: 'A' },
          date: '2026-01-01',
          valeur: 10,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2, nom: 'B' },
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

      const result = await listValeursRemarquablesForIndicateur(indId, { individus: [dept1] })

      expect(result._unsafeUnwrap()).toMatchObject({
        min: 10,
        max: 20,
        mediane: 15,
      })
    }),
  )

  it(
    "rejette quand l'indicateur est introuvable",
    integrationTest(async () => {
      await expect(
        listValeursRemarquablesForIndicateur(testIndicateurId(), { individus: [testDeptId()] }),
      ).rejects.toThrow()
    }),
  )
})
