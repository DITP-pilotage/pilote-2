import { describe, expect, it } from 'vitest'

import { grantDossierPermission } from '@/permission/commands/grantDossierPermission'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin } from '@/test/runAsPrincipal'

const CALLER_ID = '00000000-0000-0000-0000-0000000000a1'

describe.concurrent('grantDossierPermission', () => {
  it(
    'accorde une action sur un panier et propage READ aux indicateurs hérités',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({ nom: 'Contenu' })
      const pan = await fixtures.dossier({
        nom: 'Mon panier',
        indicateurs: [{ publicId: ind.publicId }],
      })

      const result = await runAsAdmin(CALLER_ID, () =>
        grantDossierPermission({
          principalId: target.id,
          dossierPublicId: pan.publicId,
          action: 'READ',
        }),
      )
      const model = result._unsafeUnwrap()

      expect(model.dossiers).toEqual([
        { publicId: pan.publicId, nom: 'Mon panier', actions: ['READ'] },
      ])
      expect(model.indicateursHerites).toEqual([
        {
          publicId: ind.publicId,
          nom: 'Contenu',
          viaDossierPublicId: pan.publicId,
          viaDossierNom: 'Mon panier',
        },
      ])
    }),
  )

  it(
    'rejette un panier inconnu',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      await expect(
        runAsAdmin(CALLER_ID, () =>
          grantDossierPermission({
            principalId: target.id,
            dossierPublicId: 'PAN-INEXISTANT',
            action: 'READ',
          }),
        ),
      ).rejects.toThrow()
    }),
  )
})
