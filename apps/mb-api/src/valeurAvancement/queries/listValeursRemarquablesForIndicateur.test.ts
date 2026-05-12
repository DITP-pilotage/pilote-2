import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testDeptIds, testIndicateurId } from '@/test/randomIds'
import { listValeursRemarquablesForIndicateur } from '@/valeurAvancement/queries/listValeursRemarquablesForIndicateur'

describe.concurrent('listValeursRemarquablesForIndicateur', () => {
  it(
    'retourne variation = null pour un individu sans valeur',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      await fixtures.indicateur({ publicId: indId, nom: 'T' })
      await fixtures.individu({ publicId: deptId, nom: 'Vaucluse' })

      const result = await listValeursRemarquablesForIndicateur(indId, { individus: [deptId] })

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ individu: deptId, variation: null }],
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
