import { describe, expect, it } from 'vitest'

import { createApiKey } from '@/apiKey/commands/createApiKey'
import { env } from '@/env'
import { hashApiKey, looksLikeApiKey } from '@/framework/auth/apiKey'
import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor, runAsUser } from '@/test/runAsPrincipal'

const ADMIN_ID = '00000000-0000-0000-0000-0000000000a1'

describe.concurrent('createApiKey', () => {
  it(
    'crée une clé et renvoie rawKey (rôle ADMIN)',
    integrationTest(async () => {
      const result = await runAsAdmin(ADMIN_ID, () =>
        createApiKey({ label: 'CI', role: 'CONTRIBUTOR', expiresAt: null }),
      )
      expect(result.isOk()).toBe(true)
      const created = result._unsafeUnwrap()
      expect(looksLikeApiKey(created.rawKey)).toBe(true)
      expect(created.label).toBe('CI')
      expect(created.role).toBe('CONTRIBUTOR')
      expect(created.status).toBe('active')

      // Persistance : seul le hash est stocké, jamais la clé en clair.
      const row = await db().apiKey.findUniqueOrThrow({ where: { id: created.id } })
      expect(row.keyHash).toBe(hashApiKey(created.rawKey, env.API_KEY_HMAC_SECRET))
      expect(row.keyHash).not.toContain(created.rawKey)
    }),
  )

  it(
    'applique le rôle ADMIN et expiresAt',
    integrationTest(async () => {
      const result = await runAsAdmin(ADMIN_ID, () =>
        createApiKey({ label: 'k', role: 'ADMIN', expiresAt: '2020-01-01T00:00:00.000Z' }),
      )
      const created = result._unsafeUnwrap()
      expect(created.role).toBe('ADMIN')
      expect(created.status).toBe('expired')
      expect(created.expiresAt).toBe('2020-01-01T00:00:00.000Z')
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      await expect(
        runAsContributor(ADMIN_ID, () =>
          createApiKey({ label: 'k', role: 'CONTRIBUTOR', expiresAt: null }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    'rejette un utilisateur OIDC (ForbiddenError)',
    integrationTest(async () => {
      await expect(
        runAsUser('00000000-0000-0000-0000-0000000000f1', () =>
          createApiKey({ label: 'k', role: 'CONTRIBUTOR', expiresAt: null }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})
