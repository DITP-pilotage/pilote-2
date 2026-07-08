import { describe, expect, it } from 'vitest'
import { uuidv7 } from 'uuidv7'

import { ForbiddenError } from '@/framework/errors/AppError'
import { PermissionAction } from '@/generated/prisma/enums'
import { getPrincipalPermissions } from '@/permission/queries/getPrincipalPermissions'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const CALLER_ID = '00000000-0000-0000-0000-0000000000a1'

describe.concurrent('getPrincipalPermissions', () => {
  it(
    'regroupe les permissions directes et calcule les indicateurs hérités',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind1 = await fixtures.indicateur({ nom: 'Indic 1' })
      const ind2 = await fixtures.indicateur({ nom: 'Indic 2' })
      const pan = await fixtures.dossier({
        nom: 'Panier',
        indicateurs: [{ publicId: ind2.publicId }],
      })
      await fixtures.indicateurPermission({
        principalId: target.id,
        indicateur: { publicId: ind1.publicId },
        action: PermissionAction.WRITE,
      })
      await fixtures.dossierPermission({
        principalId: target.id,
        dossier: { publicId: pan.publicId },
        action: PermissionAction.READ,
      })

      const result = await runAsAdmin(CALLER_ID, () => getPrincipalPermissions(target.id))
      const model = result._unsafeUnwrap()

      expect(model.dossiers).toEqual([{ publicId: pan.publicId, nom: 'Panier', actions: ['READ'] }])
      expect(model.indicateurs).toEqual([
        { publicId: ind1.publicId, nom: 'Indic 1', actions: ['WRITE'] },
      ])
      expect(model.indicateursHerites).toEqual([
        {
          publicId: ind2.publicId,
          nom: 'Indic 2',
          viaDossierPublicId: pan.publicId,
          viaDossierNom: 'Panier',
        },
      ])
    }),
  )

  it(
    "n'expose pas un indicateur en hérité s'il est déjà direct",
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({ nom: 'Direct et dans panier' })
      const pan = await fixtures.dossier({ nom: 'P', indicateurs: [{ publicId: ind.publicId }] })
      await fixtures.dossierPermission({
        principalId: target.id,
        dossier: { publicId: pan.publicId },
        action: PermissionAction.READ,
      })
      await fixtures.indicateurPermission({
        principalId: target.id,
        indicateur: { publicId: ind.publicId },
        action: PermissionAction.WRITE,
      })

      const result = await runAsAdmin(CALLER_ID, () => getPrincipalPermissions(target.id))
      const model = result._unsafeUnwrap()

      expect(model.indicateurs).toEqual([
        { publicId: ind.publicId, nom: 'Direct et dans panier', actions: ['WRITE'] },
      ])
      expect(model.indicateursHerites).toEqual([])
    }),
  )

  it(
    'rejette une clé non-ADMIN (ForbiddenError)',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      await expect(
        runAsContributor(CALLER_ID, () => getPrincipalPermissions(target.id)),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    'rejette un principal inconnu',
    integrationTest(async () => {
      await expect(runAsAdmin(CALLER_ID, () => getPrincipalPermissions(uuidv7()))).rejects.toThrow()
    }),
  )
})
