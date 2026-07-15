import { describe, expect, it } from 'vitest'

import { remplacerUtilisateursAutorises } from '@/featureFlipping/commands/remplacerUtilisateursAutorises'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'

describe.concurrent('remplacerUtilisateursAutorises', () => {
  it(
    'remplace la liste : ajoute les nouveaux et supprime les retirés',
    integrationTest(async () => {
      const a = await fixtures.utilisateur({ email: 'a@ditp.gouv.fr' })
      const b = await fixtures.utilisateur({ email: 'b@ditp.gouv.fr' })
      const c = await fixtures.utilisateur({ email: 'c@ditp.gouv.fr' })
      const ff = await fixtures.featureFlipping({
        key: 'x',
        nom: 'X',
        etat: 'ACTIVE_POUR_UTILISATEUR',
        utilisateurs: [{ id: a.id }, { id: b.id }],
      })

      const result = await remplacerUtilisateursAutorises(ff.id, {
        utilisateurIds: [b.id, c.id],
      })

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
      const ff = await fixtures.featureFlipping({ utilisateurs: [{ id: a.id }] })

      const result = await remplacerUtilisateursAutorises(ff.id, { utilisateurIds: [] })

      expect(result._unsafeUnwrap().utilisateursAutorises).toEqual([])
    }),
  )

  it(
    'rejette quand un utilisateur est inconnu',
    integrationTest(async () => {
      const ff = await fixtures.featureFlipping()

      await expect(
        remplacerUtilisateursAutorises(ff.id, {
          utilisateurIds: ['00000000-0000-0000-0000-000000000000'],
        }),
      ).rejects.toThrow()
    }),
  )
})
