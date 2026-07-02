import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { ProviderType } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'
import { listUtilisateurs } from '@/utilisateur/queries/listUtilisateurs'

const ADMIN_ID = '00000000-0000-0000-0000-000000000201'

describe.concurrent('listUtilisateurs', () => {
  it(
    'liste avec statut et providers dérivés',
    integrationTest(async () => {
      const u1 = await fixtures.utilisateur({ email: 'u1@example.gouv.fr' })
      const u2 = await fixtures.utilisateur({
        email: 'u2@example.gouv.fr',
        identite: { provider: ProviderType.proconnect, providerSub: 'sub-u2-pc' },
      })

      const result = await runAsAdmin(ADMIN_ID, () => listUtilisateurs())
      const items = result._unsafeUnwrap()
      const byId = new Map(items.map((u) => [u.id, u]))

      expect(byId.get(u1.id)?.status).toBe('en_attente')
      expect(byId.get(u1.id)?.providers).toEqual([])
      expect(byId.get(u2.id)?.status).toBe('actif')
      expect(byId.get(u2.id)?.providers).toEqual(['proconnect'])
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      await expect(runAsContributor(ADMIN_ID, () => listUtilisateurs())).rejects.toBeInstanceOf(
        ForbiddenError,
      )
    }),
  )
})
