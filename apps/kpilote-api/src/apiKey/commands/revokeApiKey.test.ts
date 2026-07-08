import { describe, expect, it } from 'vitest'

import { revokeApiKey } from '@/apiKey/commands/revokeApiKey'
import { parseIsoInstant, toDate } from '@/framework/date'
import { ConflictError, ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const ADMIN_ID = '00000000-0000-0000-0000-0000000000c1'

describe.concurrent('revokeApiKey', () => {
  it(
    'révoque une clé (soft-delete)',
    integrationTest(async () => {
      const key = await fixtures.apiKey({
        label: 'to-revoke',
        rawKey: 'pilote_live_revoke_ok_key_value_okok',
      })
      const result = await runAsAdmin(ADMIN_ID, () => revokeApiKey(key.id))
      const revoked = result._unsafeUnwrap()
      expect(revoked.status).toBe('revoked')
      expect(revoked.revokedAt).not.toBeNull()

      const row = await db().apiKey.findUniqueOrThrow({ where: { id: key.id } })
      expect(row.revokedAt).not.toBeNull()
    }),
  )

  it(
    'rejette une clé déjà révoquée (ConflictError)',
    integrationTest(async () => {
      const key = await fixtures.apiKey({
        label: 'already',
        rawKey: 'pilote_live_revoke_already_value_okk',
        revokedAt: toDate(parseIsoInstant('2024-01-01T00:00:00Z')),
      })
      await expect(runAsAdmin(ADMIN_ID, () => revokeApiKey(key.id))).rejects.toBeInstanceOf(
        ConflictError,
      )
    }),
  )

  it(
    'interdit de révoquer sa propre clé (ConflictError)',
    integrationTest(async () => {
      const key = await fixtures.apiKey({
        label: 'self',
        rawKey: 'pilote_live_revoke_self_value_okokok',
      })
      await expect(runAsAdmin(key.id, () => revokeApiKey(key.id))).rejects.toBeInstanceOf(
        ConflictError,
      )
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      const key = await fixtures.apiKey({
        label: 'forbidden',
        rawKey: 'pilote_live_revoke_forbidden_value_o',
      })
      await expect(runAsContributor(ADMIN_ID, () => revokeApiKey(key.id))).rejects.toBeInstanceOf(
        ForbiddenError,
      )
    }),
  )

  it(
    'rejette un id inconnu',
    integrationTest(async () => {
      await expect(
        runAsAdmin(ADMIN_ID, () => revokeApiKey('00000000-0000-0000-0000-0000000000ff')),
      ).rejects.toThrow()
    }),
  )
})
