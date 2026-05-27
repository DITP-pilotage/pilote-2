import { describe, expect, it } from 'vitest'

import { encodeCursor } from '@/framework/persistence/paginate'
import { listReferentiels } from '@/referentiel/queries/listReferentiels'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('listReferentiels', () => {
  it(
    "retourne une liste vide quand aucun référentiel n'existe",
    integrationTest(async () => {
      const result = await listReferentiels({})

      expect(result.isOk()).toBe(true)
      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )

  it(
    "retourne les référentiels avec leur nombre d'individus",
    integrationTest(async () => {
      await fixtures.individu(
        {
          publicId: 'A-1',
          referentiel: { publicId: 'REF-ALPHA', nom: 'Alpha' },
        },
        {
          publicId: 'A-2',
          referentiel: { publicId: 'REF-ALPHA' },
        },
      )
      await fixtures.referentiel({ publicId: 'REF-BETA', nom: 'Beta' })

      const result = await listReferentiels({})

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            id: 'REF-ALPHA',
            nom: 'Alpha',
            description: null,
            nombreIndividus: 2,
            widgets: [],
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          {
            id: 'REF-BETA',
            nom: 'Beta',
            description: null,
            nombreIndividus: 0,
            widgets: [],
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        ],
        pagination: { cursor: null, hasMore: false },
        total: 2,
      })
    }),
  )

  it(
    'filtre par recherche case-insensitive',
    integrationTest(async () => {
      await fixtures.referentiel(
        { publicId: 'REF-DEPT', nom: 'Départements de France' },
        { publicId: 'REF-REG', nom: 'Régions de France' },
        { publicId: 'REF-NAT', nom: 'France national' },
      )

      const result = await listReferentiels({ recherche: 'régions' })

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            id: 'REF-REG',
            nom: 'Régions de France',
            description: null,
            nombreIndividus: 0,
            widgets: [],
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        ],
        pagination: { cursor: null, hasMore: false },
        total: 1,
      })
    }),
  )

  it(
    'pagine au-delà de la taille de page',
    integrationTest(async () => {
      const created = await fixtures.referentiel(
        { publicId: 'REF-1', nom: 'R1' },
        { publicId: 'REF-2', nom: 'R2' },
        { publicId: 'REF-3', nom: 'R3' },
        { publicId: 'REF-4', nom: 'R4' },
        { publicId: 'REF-5', nom: 'R5' },
        { publicId: 'REF-6', nom: 'R6' },
      )

      const result = await listReferentiels({ pageSize: 5 })

      const value = result._unsafeUnwrap()
      expect(value.items).toHaveLength(5)
      expect(value.items.map((r) => r.id)).toEqual(['REF-1', 'REF-2', 'REF-3', 'REF-4', 'REF-5'])
      expect(value.pagination).toEqual({ cursor: encodeCursor(created[4]!.id), hasMore: true })
      expect(value.total).toBe(6)
    }),
  )
})
