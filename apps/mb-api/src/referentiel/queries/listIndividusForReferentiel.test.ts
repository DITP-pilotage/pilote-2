import { describe, expect, it } from 'vitest'

import { listIndividusForReferentiel } from '@/referentiel/queries/listIndividusForReferentiel'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testIndividuId, testReferentielId } from '@/test/randomIds'

describe.concurrent('listIndividusForReferentiel', () => {
  it(
    'retourne les individus de la population du référentiel',
    integrationTest(async () => {
      const refPop = testReferentielId()
      const refOther = testReferentielId()
      const p1 = testIndividuId()
      const p2 = testIndividuId()
      const o1 = testIndividuId()
      await fixtures.individu(
        {
          publicId: p1,
          nom: 'Premier',
          referentiel: { publicId: refPop, nom: 'Pop' },
        },
        {
          publicId: p2,
          nom: 'Second',
          referentiel: { publicId: refPop },
        },
        {
          publicId: o1,
          nom: 'Hors population',
          referentiel: { publicId: refOther, nom: 'Other' },
        },
      )

      const result = await listIndividusForReferentiel(refPop, {})

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            id: p1,
            nom: 'Premier',
            referentiel: refPop,
            parents: [],
            metadata: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          {
            id: p2,
            nom: 'Second',
            referentiel: refPop,
            parents: [],
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
      const refSearch = testReferentielId()
      const a1 = testIndividuId()
      const a2 = testIndividuId()
      const a3 = testIndividuId()
      await fixtures.individu(
        {
          publicId: a1,
          nom: 'Alpha',
          referentiel: { publicId: refSearch, nom: 'Search' },
        },
        {
          publicId: a2,
          nom: 'Bravo',
          referentiel: { publicId: refSearch },
        },
        {
          publicId: a3,
          nom: 'ALPHA majuscule',
          referentiel: { publicId: refSearch },
        },
      )

      const result = await listIndividusForReferentiel(refSearch, { recherche: 'alpha' })

      expect(result._unsafeUnwrap()).toEqual({
        items: [
          {
            id: a1,
            nom: 'Alpha',
            referentiel: refSearch,
            parents: [],
            metadata: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          {
            id: a3,
            nom: 'ALPHA majuscule',
            referentiel: refSearch,
            parents: [],
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
      const refMeta = testReferentielId()
      const m1 = testIndividuId()
      await fixtures.individu({
        publicId: m1,
        nom: 'Avec metadata',
        referentiel: { publicId: refMeta, nom: 'Meta' },
        metadata: { codeInsee: '75', region: 'IDF' },
      })

      const result = await listIndividusForReferentiel(refMeta, {})

      expect(result._unsafeUnwrap().items).toEqual([
        {
          id: m1,
          nom: 'Avec metadata',
          referentiel: refMeta,
          parents: [],
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
