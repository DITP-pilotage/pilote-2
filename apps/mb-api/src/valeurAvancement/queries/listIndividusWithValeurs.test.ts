import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testDeptIds, testIndicateurId, testRegId } from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'
import { listIndividusWithValeurs } from '@/valeurAvancement/queries/listIndividusWithValeurs'

describe.concurrent('listIndividusWithValeurs', () => {
  it(
    'retourne les individus ayant au moins une valeur avec dernière valeur et nombre',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const [dept1, dept2, dept3] = testDeptIds(3)
      await fixtures.individu(
        {
          publicId: dept1,
          nom: 'Vaucluse',
          referentiel: { publicId: 'REF-DEPT', nom: 'Dept' },
        },
        {
          publicId: dept2,
          nom: 'BdR',
          referentiel: { publicId: 'REF-DEPT' },
        },
        {
          publicId: dept3,
          nom: 'AM',
          referentiel: { publicId: 'REF-DEPT' },
        },
      )
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: dept1 },
          date: '2024-01-01',
          valeur: 1,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept1 },
          date: '2024-06-01',
          valeur: 2.5,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: dept2 },
          date: '2024-01-01',
          valeur: 5,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () => listIndividusWithValeurs(indId, {}))

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            individu: {
              id: dept1,
              nom: 'Vaucluse',
              referentiel: 'REF-DEPT',
              metadata: null,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
            derniereValeur: { date: '2024-06-01', valeur: 2.5 },
            nombreValeurs: 2,
          },
          {
            individu: {
              id: dept2,
              nom: 'BdR',
              referentiel: 'REF-DEPT',
              metadata: null,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
            derniereValeur: { date: '2024-01-01', valeur: 5 },
            nombreValeurs: 1,
          },
        ],
        pagination: { cursor: null, hasMore: false },
        total: 2,
      })
    }),
  )

  it(
    'filtre par référentiel',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const deptId = testDeptId()
      const regId = testRegId()
      await fixtures.individu(
        {
          publicId: deptId,
          nom: 'Vaucluse',
          referentiel: { publicId: 'REF-DEPT', nom: 'Dept' },
        },
        {
          publicId: regId,
          nom: 'PACA',
          referentiel: { publicId: 'REF-REG', nom: 'Reg' },
        },
      )
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: deptId },
          date: '2024-01-01',
          valeur: 1,
        },
        {
          indicateur: { publicId: indId },
          individu: { publicId: regId },
          date: '2024-01-01',
          valeur: 2,
        },
      )
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listIndividusWithValeurs(indId, { referentiel: 'REF-REG' }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            individu: {
              id: regId,
              nom: 'PACA',
              referentiel: 'REF-REG',
              metadata: null,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            },
            derniereValeur: { date: '2024-01-01', valeur: 2 },
            nombreValeurs: 1,
          },
        ],
        pagination: { cursor: null, hasMore: false },
        total: 1,
      })
    }),
  )

  it(
    "retourne une liste vide quand l'indicateur est introuvable",
    integrationTest(async () => {
      const apiKey = await fixtures.apiKey()
      const result = await runAsPrincipal(apiKey.id, () =>
        listIndividusWithValeurs(testIndicateurId(), {}),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )

  it(
    'retourne une liste vide quand le référentiel filtré est introuvable',
    integrationTest(async () => {
      const indId = testIndicateurId()
      await fixtures.indicateur({ publicId: indId, nom: 'T' })
      const apiKey = await fixtures.apiKey({
        permissions: [{ indicateur: { publicId: indId }, action: 'READ' }],
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listIndividusWithValeurs(indId, { referentiel: 'REF-INCONNU' }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )

  it(
    "retourne une liste vide quand le principal n'a pas READ sur l'indicateur",
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

      const result = await runAsPrincipal(apiKey.id, () => listIndividusWithValeurs(indId, {}))

      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )
})
