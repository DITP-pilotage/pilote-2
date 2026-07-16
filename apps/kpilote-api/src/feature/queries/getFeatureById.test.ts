import { describe, expect, it } from 'vitest'

import { getFeatureById } from '@/feature/queries/getFeatureById'
import { ForbiddenError } from '@/framework/errors/AppError'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const ADMIN_ID = '00000000-0000-0000-0000-000000000201'

describe.concurrent('getFeatureById', () => {
  it(
    'renvoie le détail avec ses utilisateurs autorisés triés par email',
    integrationTest(async () => {
      const zoe = await fixtures.utilisateur({ email: 'zoe@ditp.gouv.fr' })
      const alice = await fixtures.utilisateur({ email: 'alice@ditp.gouv.fr' })
      const feature = await fixtures.feature({
        key: 'NOUVEAU_DASHBOARD',
        nom: 'Nouveau dashboard',
        etat: 'ACTIVE_POUR_UTILISATEUR',
        utilisateurs: [{ id: zoe.id }, { id: alice.id }],
      })

      const result = await runAsAdmin(ADMIN_ID, () => getFeatureById(feature.id))

      const detail = result._unsafeUnwrap()
      expect(detail).toMatchObject({ key: 'NOUVEAU_DASHBOARD', etat: 'ACTIVE_POUR_UTILISATEUR' })
      expect(detail.utilisateursAutorises.map((u) => u.email)).toEqual([
        'alice@ditp.gouv.fr',
        'zoe@ditp.gouv.fr',
      ])
    }),
  )

  it(
    'rejette quand la feature est introuvable',
    integrationTest(async () => {
      await expect(
        runAsAdmin(ADMIN_ID, () => getFeatureById('00000000-0000-0000-0000-000000000000')),
      ).rejects.toThrow()
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      const feature = await fixtures.feature()
      await expect(
        runAsContributor(ADMIN_ID, () => getFeatureById(feature.id)),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})
