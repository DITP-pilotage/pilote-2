import { describe, expect, it } from 'vitest'

import { ForbiddenError } from '@/framework/errors/AppError'
import { ProviderType } from '@/generated/prisma/enums'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'
import { getUtilisateurById } from '@/utilisateur/queries/getUtilisateurById'

const ADMIN_ID = '00000000-0000-0000-0000-000000000201'

describe.concurrent('getUtilisateurById', () => {
  it(
    'retourne un utilisateur avec statut et providers dérivés',
    integrationTest(async () => {
      const u = await fixtures.utilisateur({
        email: 'detail@example.gouv.fr',
        identite: { provider: ProviderType.proconnect, providerSub: 'sub-detail-pc' },
      })

      const result = await runAsAdmin(ADMIN_ID, () => getUtilisateurById(u.id))

      expect(result._unsafeUnwrap()).toMatchObject({
        id: u.id,
        email: 'detail@example.gouv.fr',
        status: 'actif',
        providers: ['proconnect'],
      })
    }),
  )

  it(
    'rejette quand l’utilisateur est introuvable',
    integrationTest(async () => {
      await expect(
        runAsAdmin(ADMIN_ID, () => getUtilisateurById('00000000-0000-0000-0000-0000000009ff')),
      ).rejects.toThrow()
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      const u = await fixtures.utilisateur({ email: 'detail2@example.gouv.fr' })
      await expect(
        runAsContributor(ADMIN_ID, () => getUtilisateurById(u.id)),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})
