import { describe, expect, it } from 'vitest'

import { listIndividusForReferentiel } from '@/referentiel/queries/listIndividusForReferentiel'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('listIndividusForReferentiel', () => {
  it(
    'retourne les individus de la population du référentiel',
    integrationTest(async () => {
      await fixtures.referentiel(
        { publicId: 'REF-pop', nom: 'Pop' },
        { publicId: 'REF-other', nom: 'Other' },
      )
      await fixtures.individu(
        { publicId: 'P-1', nom: 'Premier' },
        { publicId: 'P-2', nom: 'Second' },
        { publicId: 'O-1', nom: 'Hors population' },
      )
      await fixtures.referentielIndividu(
        { referentielPublicId: 'REF-pop', individuPublicId: 'P-1' },
        { referentielPublicId: 'REF-pop', individuPublicId: 'P-2' },
        { referentielPublicId: 'REF-other', individuPublicId: 'O-1' },
      )

      const result = await listIndividusForReferentiel('REF-pop', {})

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id)).toEqual(['P-1', 'P-2'])
      expect(value.total).toBe(2)
    }),
  )

  it(
    'inclut les autres référentiels auxquels appartient un individu',
    integrationTest(async () => {
      await fixtures.referentiel(
        { publicId: 'REF-a', nom: 'A' },
        { publicId: 'REF-b', nom: 'B' },
      )
      await fixtures.individu({ publicId: 'I-1' })
      await fixtures.referentielIndividu(
        { referentielPublicId: 'REF-a', individuPublicId: 'I-1' },
        { referentielPublicId: 'REF-b', individuPublicId: 'I-1' },
      )

      const result = await listIndividusForReferentiel('REF-a', {})

      const value = result._unsafeUnwrap()
      expect(value.items[0]?.referentiels.sort()).toEqual(['REF-a', 'REF-b'])
    }),
  )

  it(
    'filtre par recherche sur le nom',
    integrationTest(async () => {
      await fixtures.referentiel({ publicId: 'REF-search', nom: 'Search' })
      await fixtures.individu(
        { publicId: 'A-1', nom: 'Alpha' },
        { publicId: 'A-2', nom: 'Bravo' },
        { publicId: 'A-3', nom: 'ALPHA majuscule' },
      )
      await fixtures.referentielIndividu(
        { referentielPublicId: 'REF-search', individuPublicId: 'A-1' },
        { referentielPublicId: 'REF-search', individuPublicId: 'A-2' },
        { referentielPublicId: 'REF-search', individuPublicId: 'A-3' },
      )

      const result = await listIndividusForReferentiel('REF-search', { recherche: 'alpha' })

      const value = result._unsafeUnwrap()
      expect(value.items.map((i) => i.id).sort()).toEqual(['A-1', 'A-3'])
      expect(value.total).toBe(2)
    }),
  )

  it(
    'rejette quand le référentiel est introuvable',
    integrationTest(async () => {
      await expect(listIndividusForReferentiel('REF-inconnu', {})).rejects.toThrow()
    }),
  )
})
