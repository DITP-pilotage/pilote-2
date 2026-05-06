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
    'retourne les référentiels avec leur nombre d\'individus',
    integrationTest(async () => {
      await fixtures.referentiel(
        { publicId: 'REF-ALPHA', nom: 'Alpha' },
        { publicId: 'REF-BETA', nom: 'Beta' },
      )
      await fixtures.individu({ publicId: 'A-1' }, { publicId: 'A-2' })
      await fixtures.referentielIndividu(
        { referentielPublicId: 'REF-ALPHA', individuPublicId: 'A-1' },
        { referentielPublicId: 'REF-ALPHA', individuPublicId: 'A-2' },
      )

      const result = await listReferentiels({})

      const value = result._unsafeUnwrap()
      expect(value.items.map((r) => ({ id: r.id, nombreIndividus: r.nombreIndividus }))).toEqual([
        { id: 'REF-ALPHA', nombreIndividus: 2 },
        { id: 'REF-BETA', nombreIndividus: 0 },
      ])
      expect(value.total).toBe(2)
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

      const value = result._unsafeUnwrap()
      expect(value.items.map((r) => r.id)).toEqual(['REF-REG'])
      expect(value.total).toBe(1)
    }),
  )

  it(
    'pagine au-delà de la taille de page',
    integrationTest(async () => {
      await fixtures.referentiel(
        { publicId: 'REF-1', nom: 'R1' },
        { publicId: 'REF-2', nom: 'R2' },
        { publicId: 'REF-3', nom: 'R3' },
        { publicId: 'REF-4', nom: 'R4' },
        { publicId: 'REF-5', nom: 'R5' },
        { publicId: 'REF-6', nom: 'R6' },
      )

      const result = await listReferentiels({})

      const value = result._unsafeUnwrap()
      expect(value.items.map((r) => r.id)).toEqual([
        'REF-1',
        'REF-2',
        'REF-3',
        'REF-4',
        'REF-5',
      ])
      expect(value.pagination).toEqual({ cursor: encodeCursor('REF-5'), hasMore: true })
      expect(value.total).toBe(6)
    }),
  )
})
