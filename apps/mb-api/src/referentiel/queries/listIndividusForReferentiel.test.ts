import { describe, expect, it } from 'vitest'

import { listIndividusForReferentiel } from '@/referentiel/queries/listIndividusForReferentiel'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('listIndividusForReferentiel', () => {
  it(
    'retourne les individus de la population du référentiel',
    integrationTest(async () => {
      await fixtures.referentiel(
        { publicId: 'REF-POP', nom: 'Pop' },
        { publicId: 'REF-OTHER', nom: 'Other' },
      )
      await fixtures.individu(
        { publicId: 'P-1', nom: 'Premier' },
        { publicId: 'P-2', nom: 'Second' },
        { publicId: 'O-1', nom: 'Hors population' },
      )
      await fixtures.referentielIndividu(
        { referentielPublicId: 'REF-POP', individuPublicId: 'P-1' },
        { referentielPublicId: 'REF-POP', individuPublicId: 'P-2' },
        { referentielPublicId: 'REF-OTHER', individuPublicId: 'O-1' },
      )

      const result = await listIndividusForReferentiel('REF-POP', {})

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            id: 'P-1',
            nom: 'Premier',
            referentiels: ['REF-POP'],
            createdAt: expect.any(String) as string,
            updatedAt: expect.any(String) as string,
          },
          {
            id: 'P-2',
            nom: 'Second',
            referentiels: ['REF-POP'],
            createdAt: expect.any(String) as string,
            updatedAt: expect.any(String) as string,
          },
        ],
        pagination: { cursor: null, hasMore: false },
        total: 2,
      })
    }),
  )

  it(
    'inclut les autres référentiels auxquels appartient un individu',
    integrationTest(async () => {
      await fixtures.referentiel(
        { publicId: 'REF-A', nom: 'A' },
        { publicId: 'REF-B', nom: 'B' },
      )
      await fixtures.individu({ publicId: 'I-1' })
      await fixtures.referentielIndividu(
        { referentielPublicId: 'REF-A', individuPublicId: 'I-1' },
        { referentielPublicId: 'REF-B', individuPublicId: 'I-1' },
      )

      const result = await listIndividusForReferentiel('REF-A', {})

      const value = result._unsafeUnwrap()
      expect(value.items[0]?.referentiels.sort()).toEqual(['REF-A', 'REF-B'])
    }),
  )

  it(
    'filtre par recherche sur le nom',
    integrationTest(async () => {
      await fixtures.referentiel({ publicId: 'REF-SEARCH', nom: 'Search' })
      await fixtures.individu(
        { publicId: 'A-1', nom: 'Alpha' },
        { publicId: 'A-2', nom: 'Bravo' },
        { publicId: 'A-3', nom: 'ALPHA majuscule' },
      )
      await fixtures.referentielIndividu(
        { referentielPublicId: 'REF-SEARCH', individuPublicId: 'A-1' },
        { referentielPublicId: 'REF-SEARCH', individuPublicId: 'A-2' },
        { referentielPublicId: 'REF-SEARCH', individuPublicId: 'A-3' },
      )

      const result = await listIndividusForReferentiel('REF-SEARCH', { recherche: 'alpha' })

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            id: 'A-1',
            nom: 'Alpha',
            referentiels: ['REF-SEARCH'],
            createdAt: expect.any(String) as string,
            updatedAt: expect.any(String) as string,
          },
          {
            id: 'A-3',
            nom: 'ALPHA majuscule',
            referentiels: ['REF-SEARCH'],
            createdAt: expect.any(String) as string,
            updatedAt: expect.any(String) as string,
          },
        ],
        pagination: { cursor: null, hasMore: false },
        total: 2,
      })
    }),
  )

  it(
    'retourne une liste vide quand le référentiel est introuvable',
    integrationTest(async () => {
      const result = await listIndividusForReferentiel('REF-INCONNU', {})

      expect(result._unsafeUnwrap()).toEqual({
        items: [],
        pagination: { cursor: null, hasMore: false },
        total: 0,
      })
    }),
  )
})
