import { describe, expect, it } from 'vitest'

import { remplacerUtilisateursAutorises } from '@/feature/commands/remplacerUtilisateursAutorises'
import { ForbiddenError } from '@/framework/errors/AppError'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const ADMIN_ID = '00000000-0000-0000-0000-000000000201'

describe.concurrent('remplacerUtilisateursAutorises', () => {
  it(
    'remplace la liste : ajoute les nouveaux et supprime les retirés',
    integrationTest(async () => {
      const a = await fixtures.utilisateur({ email: 'a@ditp.gouv.fr' })
      const b = await fixtures.utilisateur({ email: 'b@ditp.gouv.fr' })
      const c = await fixtures.utilisateur({ email: 'c@ditp.gouv.fr' })
      const feature = await fixtures.feature({
        key: 'X',
        nom: 'X',
        etat: 'ACTIVE_POUR_UTILISATEUR',
        utilisateurs: [{ id: a.id }, { id: b.id }],
      })

      const result = await runAsAdmin(ADMIN_ID, () =>
        remplacerUtilisateursAutorises(feature.id, { utilisateurIds: [b.id, c.id] }),
      )

      expect(result._unsafeUnwrap().utilisateursAutorises.map((u) => u.email)).toEqual([
        'b@ditp.gouv.fr',
        'c@ditp.gouv.fr',
      ])
    }),
  )

  it(
    'vide la liste quand utilisateurIds est vide',
    integrationTest(async () => {
      const a = await fixtures.utilisateur({ email: 'a@ditp.gouv.fr' })
      const feature = await fixtures.feature({ utilisateurs: [{ id: a.id }] })

      const result = await runAsAdmin(ADMIN_ID, () =>
        remplacerUtilisateursAutorises(feature.id, { utilisateurIds: [] }),
      )

      expect(result._unsafeUnwrap().utilisateursAutorises).toEqual([])
    }),
  )

  it(
    'rejette quand un utilisateur est inconnu',
    integrationTest(async () => {
      const feature = await fixtures.feature()

      await expect(
        runAsAdmin(ADMIN_ID, () =>
          remplacerUtilisateursAutorises(feature.id, {
            utilisateurIds: ['00000000-0000-0000-0000-000000000000'],
          }),
        ),
      ).rejects.toThrow()
    }),
  )

  it(
    'rejette une clé CONTRIBUTOR (ForbiddenError)',
    integrationTest(async () => {
      const feature = await fixtures.feature()
      await expect(
        runAsContributor(ADMIN_ID, () =>
          remplacerUtilisateursAutorises(feature.id, { utilisateurIds: [] }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )
})
