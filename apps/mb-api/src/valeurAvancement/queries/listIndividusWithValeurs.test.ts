import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testDeptId, testIndicateurId, testRegId } from '@/test/randomIds'
import { listIndividusWithValeurs } from '@/valeurAvancement/queries/listIndividusWithValeurs'

describe.concurrent('listIndividusWithValeurs', () => {
  it(
    'retourne les individus ayant au moins une valeur avec dernière valeur et nombre',
    integrationTest(async () => {
      const indId = testIndicateurId()
      const dept1 = testDeptId()
      const dept2 = testDeptId()
      const dept3 = testDeptId()
      await fixtures.individu({ publicId: dept3, nom: 'AM' })
      await fixtures.valeurAvancement(
        {
          indicateur: { publicId: indId, nom: 'T' },
          individu: { publicId: dept1, nom: 'Vaucluse' },
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
          individu: { publicId: dept2, nom: 'BdR' },
          date: '2024-01-01',
          valeur: 5,
        },
      )

      const result = await listIndividusWithValeurs(indId, {})

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            individu: {
              id: dept1,
              nom: 'Vaucluse',
              referentiels: [],
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
              referentiels: [],
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
      await fixtures.referentielIndividu(
        {
          referentiel: { publicId: 'REF-DEPT', nom: 'Dept' },
          individu: { publicId: deptId, nom: 'Vaucluse' },
        },
        {
          referentiel: { publicId: 'REF-REG', nom: 'Reg' },
          individu: { publicId: regId, nom: 'PACA' },
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

      const result = await listIndividusWithValeurs(indId, { referentiel: 'REF-REG' })

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            individu: {
              id: regId,
              nom: 'PACA',
              referentiels: ['REF-REG'],
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
      const result = await listIndividusWithValeurs(testIndicateurId(), {})

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

      const result = await listIndividusWithValeurs(indId, { referentiel: 'REF-INCONNU' })

      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )
})
