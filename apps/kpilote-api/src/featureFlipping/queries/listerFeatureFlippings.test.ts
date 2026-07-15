import { describe, expect, it } from 'vitest'

import { listerFeatureFlippings } from '@/featureFlipping/queries/listerFeatureFlippings'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('listerFeatureFlippings', () => {
  it(
    'renvoie une liste vide quand aucun FF',
    integrationTest(async () => {
      const result = await listerFeatureFlippings()
      expect(result._unsafeUnwrap()).toEqual([])
    }),
  )

  it(
    'renvoie les FF triés par nom ASC',
    integrationTest(async () => {
      await fixtures.featureFlipping({ key: 'beta', nom: 'Beta', etat: 'ACTIVE' })
      await fixtures.featureFlipping({ key: 'alpha', nom: 'Alpha', etat: 'DESACTIVE' })

      const result = await listerFeatureFlippings()

      expect(result._unsafeUnwrap().map((ff) => ff.nom)).toEqual(['Alpha', 'Beta'])
      expect(result._unsafeUnwrap()[0]).toMatchObject({ key: 'alpha', etat: 'DESACTIVE' })
    }),
  )
})
