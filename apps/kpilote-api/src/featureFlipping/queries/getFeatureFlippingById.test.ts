import { describe, expect, it } from 'vitest'

import { getFeatureFlippingById } from '@/featureFlipping/queries/getFeatureFlippingById'
import { ForbiddenError } from '@/framework/errors/AppError'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const ADMIN_ID = '00000000-0000-0000-0000-000000000201'

describe.concurrent('getFeatureFlippingById', () => {
  it(
    'renvoie le détail avec ses utilisateurs autorisés triés par email',
    integrationTest(async () => {
      const zoe = await fixtures.utilisateur({ email: 'zoe@ditp.gouv.fr' })
      const alice = await fixtures.utilisateur({ email: 'alice@ditp.gouv.fr' })
      const ff = await fixtures.featureFlipping({
        key: 'nouveau_dashboard',
        nom: 'Nouveau dashboard',
        etat: 'ACTIVE_POUR_UTILISATEUR',
        utilisateurs: [{ id: zoe.id }, { id: alice.id }],
      })

      const result = await runAsAdmin(ADMIN_ID, () => getFeatureFlippingById(ff.id))

      const detail = result._unsafeUnwrap()
      expect(detail).toMatchObject({ key: 'nouveau_dashboard', etat: 'ACTIVE_POUR_UTILISATEUR' })
      expect(detail.utilisateursAutorises.map((u) => u.email)).toEqual([
        'alice@ditp.gouv.fr',
        'zoe@ditp.gouv.fr',
      ])
    }),
  )

  it(
    'rejette quand le FF est introuvable',
    integrationTest(async () => {
      await expect(
        runAsAdmin(ADMIN_ID, () => getFeatureFlippingById('00000000-0000-0000-0000-000000000000')),
      ).rejects.toThrow()
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      const ff = await fixtures.featureFlipping()
      await expect(
        runAsContributor(ADMIN_ID, () => getFeatureFlippingById(ff.id)),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})
