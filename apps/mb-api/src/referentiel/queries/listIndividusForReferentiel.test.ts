import { describe, expect, it } from 'vitest'

import { listIndividusForReferentiel } from '@/referentiel/queries/listIndividusForReferentiel'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('listIndividusForReferentiel', () => {
  it(
    'retourne les individus de la population du référentiel',
    integrationTest(async () => {
      await fixtures.referentielIndividu(
        {
          referentiel: { publicId: 'REF-POP', nom: 'Pop' },
          individu: { publicId: 'P-1', nom: 'Premier' },
        },
        {
          referentiel: { publicId: 'REF-POP' },
          individu: { publicId: 'P-2', nom: 'Second' },
        },
        {
          referentiel: { publicId: 'REF-OTHER', nom: 'Other' },
          individu: { publicId: 'O-1', nom: 'Hors population' },
        },
      )

      const result = await listIndividusForReferentiel('REF-POP', {})

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            id: 'P-1',
            nom: 'Premier',
            referentiels: ['REF-POP'],
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          {
            id: 'P-2',
            nom: 'Second',
            referentiels: ['REF-POP'],
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
    'inclut les autres référentiels auxquels appartient un individu',
    integrationTest(async () => {
      await fixtures.referentielIndividu(
        { referentiel: { publicId: 'REF-A', nom: 'A' }, individu: { publicId: 'I-1' } },
        { referentiel: { publicId: 'REF-B', nom: 'B' }, individu: { publicId: 'I-1' } },
      )

      const result = await listIndividusForReferentiel('REF-A', {})

      const value = result._unsafeUnwrap()
      expect(value.items[0]?.referentiels.sort()).toEqual(['REF-A', 'REF-B'])
    }),
  )

  it(
    'filtre par recherche sur le nom',
    integrationTest(async () => {
      await fixtures.referentielIndividu(
        {
          referentiel: { publicId: 'REF-SEARCH', nom: 'Search' },
          individu: { publicId: 'A-1', nom: 'Alpha' },
        },
        {
          referentiel: { publicId: 'REF-SEARCH' },
          individu: { publicId: 'A-2', nom: 'Bravo' },
        },
        {
          referentiel: { publicId: 'REF-SEARCH' },
          individu: { publicId: 'A-3', nom: 'ALPHA majuscule' },
        },
      )

      const result = await listIndividusForReferentiel('REF-SEARCH', { recherche: 'alpha' })

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            id: 'A-1',
            nom: 'Alpha',
            referentiels: ['REF-SEARCH'],
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          {
            id: 'A-3',
            nom: 'ALPHA majuscule',
            referentiels: ['REF-SEARCH'],
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
