import { describe, expect, it } from 'vitest'
import { uuidv7 } from 'uuidv7'

import { getApiKeyById } from '@/apiKey/queries/getApiKeyById'
import { ForbiddenError } from '@/framework/errors/AppError'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const CALLER_ID = '00000000-0000-0000-0000-0000000000a1'

describe.concurrent('getApiKeyById', () => {
  it(
    'retourne une clé par id (rôle ADMIN), sans valeur secrète',
    integrationTest(async () => {
      const created = await fixtures.apiKey({ label: 'Ingestion' })

      const result = await runAsAdmin(CALLER_ID, () => getApiKeyById(created.id))
      const model = result._unsafeUnwrap()

      expect(model.id).toBe(created.id)
      expect(model.label).toBe('Ingestion')
      expect(model).not.toHaveProperty('keyHash')
      expect(model).not.toHaveProperty('rawKey')
    }),
  )

  it(
    'rejette un id inconnu',
    integrationTest(async () => {
      await expect(runAsAdmin(CALLER_ID, () => getApiKeyById(uuidv7()))).rejects.toThrow()
    }),
  )

  it(
    'rejette une clé non-ADMIN (ForbiddenError)',
    integrationTest(async () => {
      const created = await fixtures.apiKey({})
      await expect(
        runAsContributor(CALLER_ID, () => getApiKeyById(created.id)),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})
