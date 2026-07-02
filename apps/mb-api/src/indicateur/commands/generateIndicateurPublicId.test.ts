import { describe, expect, it } from 'vitest'

import { generateIndicateurPublicId } from '@/indicateur/commands/generateIndicateurPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe('generateIndicateurPublicId', () => {
  it(
    'retourne IND-<max+1> à partir du plus grand numéro existant',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-900001' })

      const publicId = await generateIndicateurPublicId()

      expect(publicId).toBe('IND-900002')
    }),
  )

  it(
    'ignore les publicId non numériques pour le calcul du max',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-900001' })
      await fixtures.indicateur({ publicId: 'IND-ZZZ' })

      const publicId = await generateIndicateurPublicId()

      expect(publicId).toBe('IND-900002')
    }),
  )

  it(
    'deux appels successifs (après persistance) donnent des numéros consécutifs',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-900001' })

      const premier = await generateIndicateurPublicId()
      await fixtures.indicateur({ publicId: premier })
      const second = await generateIndicateurPublicId()

      expect(premier).toBe('IND-900002')
      expect(second).toBe('IND-900003')
    }),
  )
})
