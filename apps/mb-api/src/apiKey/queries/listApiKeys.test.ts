import { describe, expect, it } from 'vitest'

import { listApiKeys } from '@/apiKey/queries/listApiKeys'
import { parseIsoDate } from '@/framework/date'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin } from '@/test/runAsPrincipal'

const ADMIN_ID = '00000000-0000-0000-0000-0000000000b1'

describe.concurrent('listApiKeys', () => {
  it(
    'liste les clés avec le statut dérivé et sans secret',
    integrationTest(async () => {
      const active = await fixtures.apiKey({
        label: 'active',
        rawKey: 'pilote_live_list_active_key_value_okok',
      })
      const revoked = await fixtures.apiKey({
        label: 'revoked',
        rawKey: 'pilote_live_list_revoked_key_value_ok',
        revokedAt: parseIsoDate('2024-01-01'),
      })
      const expired = await fixtures.apiKey({
        label: 'expired',
        rawKey: 'pilote_live_list_expired_key_value_ok',
        expiresAt: parseIsoDate('2000-01-01'),
      })

      const result = await runAsAdmin(ADMIN_ID, () => listApiKeys())
      const items = result._unsafeUnwrap()
      const byId = new Map(items.map((k) => [k.id, k]))

      expect(byId.get(active.id)?.status).toBe('active')
      expect(byId.get(revoked.id)?.status).toBe('revoked')
      expect(byId.get(expired.id)?.status).toBe('expired')
      expect(JSON.stringify(items)).not.toContain('keyHash')
    }),
  )
})
