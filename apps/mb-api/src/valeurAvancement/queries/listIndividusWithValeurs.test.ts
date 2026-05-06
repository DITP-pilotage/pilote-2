import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { listIndividusWithValeurs } from '@/valeurAvancement/queries/listIndividusWithValeurs'

describe.concurrent('listIndividusWithValeurs', () => {
  it(
    'retourne les individus ayant au moins une valeur avec dernière valeur et nombre',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-001', nom: 'T' })
      await fixtures.individu(
        { publicId: 'DEPT-84', nom: 'Vaucluse' },
        { publicId: 'DEPT-13', nom: 'BdR' },
        { publicId: 'DEPT-06', nom: 'AM' },
      )
      await fixtures.valeurAvancement(
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'DEPT-84',
          date: '2024-01-01',
          valeur: '1.000000',
        },
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'DEPT-84',
          date: '2024-06-01',
          valeur: '2.500000',
        },
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'DEPT-13',
          date: '2024-01-01',
          valeur: '5.000000',
        },
      )

      const result = await listIndividusWithValeurs('IND-001', {})

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            individu: {
              id: 'DEPT-84',
              nom: 'Vaucluse',
              referentiels: [],
              createdAt: expect.any(String) as string,
              updatedAt: expect.any(String) as string,
            },
            derniereValeur: { date: '2024-06-01', valeur: 2.5 },
            nombreValeurs: 2,
          },
          {
            individu: {
              id: 'DEPT-13',
              nom: 'BdR',
              referentiels: [],
              createdAt: expect.any(String) as string,
              updatedAt: expect.any(String) as string,
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
      await fixtures.indicateur({ publicId: 'IND-001', nom: 'T' })
      await fixtures.referentiel(
        { publicId: 'REF-DEPT', nom: 'Dept' },
        { publicId: 'REF-REG', nom: 'Reg' },
      )
      await fixtures.individu(
        { publicId: 'DEPT-84', nom: 'Vaucluse' },
        { publicId: 'REG-93', nom: 'PACA' },
      )
      await fixtures.referentielIndividu(
        { referentielPublicId: 'REF-DEPT', individuPublicId: 'DEPT-84' },
        { referentielPublicId: 'REF-REG', individuPublicId: 'REG-93' },
      )
      await fixtures.valeurAvancement(
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'DEPT-84',
          date: '2024-01-01',
          valeur: '1.000000',
        },
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'REG-93',
          date: '2024-01-01',
          valeur: '2.000000',
        },
      )

      const result = await listIndividusWithValeurs('IND-001', { referentiel: 'REF-REG' })

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            individu: {
              id: 'REG-93',
              nom: 'PACA',
              referentiels: ['REF-REG'],
              createdAt: expect.any(String) as string,
              updatedAt: expect.any(String) as string,
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
      const result = await listIndividusWithValeurs('IND-999', {})

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
      await fixtures.indicateur({ publicId: 'IND-001', nom: 'T' })

      const result = await listIndividusWithValeurs('IND-001', { referentiel: 'REF-INCONNU' })

      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )
})
