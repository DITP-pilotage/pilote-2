import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testDeptIds, testIndicateurId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { listValeursForIndicateur } from '@/valeurAvancement/queries/listValeursForIndicateur'

describe.concurrent('listValeursForIndicateur', () => {
  it(
    'retourne la série temporelle pour un seul individu',
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
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursForIndicateur(indId, { individus: [deptId] }),
      )

      const value = result._unsafeUnwrap()
      expect(value.items).toEqual([
        { indicateur: indId, individu: deptId, date: '2024-01-01', valeur: 7.5 },
        { indicateur: indId, individu: deptId, date: '2024-06-01', valeur: 7.8 },
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
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursForIndicateur(indId, { individus: [dept1, dept2] }),
      )

      const value = result._unsafeUnwrap()
      const individus = value.items.map((v) => v.individu).sort()
      expect(individus).toEqual([dept1, dept2].sort())
      expect(value.items.find((v) => v.individu === dept3)).toBeUndefined()
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
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listValeursForIndicateur(indId, {
          individus: [deptId],
          dateDebut: '2024-01-01',
          dateFin: '2024-06-30',
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
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
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
})
