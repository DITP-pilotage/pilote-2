import { describe, expect, it } from 'vitest'

import { listIndividusForReferentiel } from '@/referentiel/queries/listIndividusForReferentiel'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('listIndividusForReferentiel', () => {
  it(
    'retourne les individus de la population du référentiel',
    integrationTest(async () => {
      await fixtures.individu(
        {
          publicId: 'P-1',
          nom: 'Premier',
          referentiel: { publicId: 'REF-POP', nom: 'Pop' },
        },
        {
          publicId: 'P-2',
          nom: 'Second',
          referentiel: { publicId: 'REF-POP' },
        },
        {
          publicId: 'O-1',
          nom: 'Hors population',
          referentiel: { publicId: 'REF-OTHER', nom: 'Other' },
        },
      )

      const result = await listIndividusForReferentiel('REF-POP', {})

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            id: 'P-1',
            nom: 'Premier',
            referentiel: 'REF-POP',
            metadata: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          {
            id: 'P-2',
            nom: 'Second',
            referentiel: 'REF-POP',
            metadata: null,
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
    'filtre par recherche sur le nom',
    integrationTest(async () => {
      await fixtures.individu(
        {
          publicId: 'A-1',
          nom: 'Alpha',
          referentiel: { publicId: 'REF-SEARCH', nom: 'Search' },
        },
        {
          publicId: 'A-2',
          nom: 'Bravo',
          referentiel: { publicId: 'REF-SEARCH' },
        },
        {
          publicId: 'A-3',
          nom: 'ALPHA majuscule',
          referentiel: { publicId: 'REF-SEARCH' },
        },
      )

      const result = await listIndividusForReferentiel('REF-SEARCH', { recherche: 'alpha' })

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            id: 'A-1',
            nom: 'Alpha',
            referentiel: 'REF-SEARCH',
            metadata: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          {
            id: 'A-3',
            nom: 'ALPHA majuscule',
            referentiel: 'REF-SEARCH',
            metadata: null,
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
    "renvoie le metadata JSON quand l'individu en a un",
    integrationTest(async () => {
      await fixtures.individu({
        publicId: 'M-1',
        nom: 'Avec metadata',
        referentiel: { publicId: 'REF-META', nom: 'Meta' },
        metadata: { codeInsee: '75', region: 'IDF' },
      })

      const result = await listIndividusForReferentiel('REF-META', {})

      expect(result._unsafeUnwrap().items).toEqual([
        {
          id: 'M-1',
          nom: 'Avec metadata',
          referentiel: 'REF-META',
          metadata: { codeInsee: '75', region: 'IDF' },
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ])
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
