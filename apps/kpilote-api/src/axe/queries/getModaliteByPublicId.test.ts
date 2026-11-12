import { describe, expect, it } from 'vitest'

import { getModaliteByPublicId } from '@/axe/queries/getModaliteByPublicId'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testAxeId, testModaliteId } from '@/test/randomIds'

describe.concurrent('getModaliteByPublicId', () => {
  it(
    'renvoie la modalité avec son niveau et son parent',
    integrationTest(async () => {
      const axe = { publicId: testAxeId() }
      const famille = await fixtures.modalite({ nom: 'Fraude fiscale', niveau: { axe, ordre: 1 } })
      const tva = await fixtures.modalite({
        nom: 'Fraude à la TVA',
        niveau: { axe, ordre: 2 },
        parent: { publicId: famille.publicId },
      })

      const result = await getModaliteByPublicId({ publicId: tva.publicId })

      expect(result._unsafeUnwrap()).toEqual({
        id: tva.publicId,
        nom: 'Fraude à la TVA',
        niveau: 2,
        parent: famille.publicId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    }),
  )

  it(
    'renvoie une modalité du premier niveau sans parent',
    integrationTest(async () => {
      const famille = await fixtures.modalite({ nom: 'Fraude sociale' })

      const result = await getModaliteByPublicId({ publicId: famille.publicId })

      expect(result._unsafeUnwrap()).toMatchObject({ niveau: 1, parent: null })
    }),
  )

  it(
    'échoue quand la modalité n’existe pas',
    integrationTest(async () => {
      await expect(getModaliteByPublicId({ publicId: testModaliteId() })).rejects.toThrow()
    }),
  )
})
