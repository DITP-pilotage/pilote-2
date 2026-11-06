import { describe, expect, it } from 'vitest'

import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { grantIndicateurPermission } from '@/permission/commands/grantIndicateurPermission'
import { replacePrincipalPermissions } from '@/permission/commands/replacePrincipalPermissions'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsPrincipal } from '@/test/runAsPrincipal'
import { upsertValeurAvancement } from '@/valeurAvancement/commands/upsertValeurAvancement'

// Cloisonnement d'écriture par périmètre (cf. dimensions-design.md §5.10) :
// pose atomique avec le droit, différentiel de PUT /permissions.

const ADMIN_ID = '00000000-0000-0000-0000-0000000000b7'

const etatPermission = async (principalId: string, indicateurPublicId: string) => {
  const permission = await db().indicateurPermission.findFirst({
    where: { principalId, indicateur: { publicId: indicateurPublicId }, action: 'WRITE_DATA' },
    include: { perimetres: { include: { individu: { select: { publicId: true } } } } },
  })
  return (
    permission && {
      restreint: permission.perimetreRestreint,
      perimetre: permission.perimetres.map((p) => p.individu.publicId).sort(),
    }
  )
}

describe.concurrent('POST /permissions/indicateur — périmètre', () => {
  it(
    'pose atomiquement le droit WRITE_DATA et son périmètre, appliqué aux écritures',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const cible = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: cube.indicateur }, action: IndicateurPermissionAction.READ },
        ],
      })

      const result = await runAsAdmin(ADMIN_ID, () =>
        grantIndicateurPermission({
          principalId: cible.id,
          indicateurPublicId: cube.indicateur,
          action: IndicateurPermissionAction.WRITE_DATA,
          perimetre: [cube.orange],
        }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([
        {
          publicId: cube.indicateur,
          nom: 'Indicateur croisé',
          actions: [IndicateurPermissionAction.READ, IndicateurPermissionAction.WRITE_DATA],
          perimetre: [cube.orange],
        },
      ])
      expect(await etatPermission(cible.id, cube.indicateur)).toEqual({
        restreint: true,
        perimetre: [cube.orange],
      })
      const ecrire = (operateur: string) =>
        runAsPrincipal(cible.id, () =>
          upsertValeurAvancement({
            indicateurPublicId: cube.indicateur,
            body: { coordonnees: [cube.deptA, operateur], date: '2024-01-01', valeur: 1 },
          }),
        )
      expect((await ecrire(cube.orange)).isOk()).toBe(true)
      expect((await ecrire(cube.sfr))._unsafeUnwrapErr().type).toBe('HORS_PERIMETRE')
    }),
  )

  it(
    '`[]` restreint sans périmètre, `null` lève la restriction, absent la conserve',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const cible = await fixtures.apiKey()
      const accorder = (perimetre?: string[] | null) =>
        runAsAdmin(ADMIN_ID, () =>
          grantIndicateurPermission({
            principalId: cible.id,
            indicateurPublicId: cube.indicateur,
            action: IndicateurPermissionAction.WRITE_DATA,
            ...(perimetre !== undefined && { perimetre }),
          }),
        )

      await accorder([cube.orange, cube.sfr])
      await accorder()
      expect(await etatPermission(cible.id, cube.indicateur)).toEqual({
        restreint: true,
        perimetre: [cube.orange, cube.sfr].sort(),
      })

      await accorder([])
      expect(await etatPermission(cible.id, cube.indicateur)).toEqual({
        restreint: true,
        perimetre: [],
      })

      await accorder(null)
      expect(await etatPermission(cible.id, cube.indicateur)).toEqual({
        restreint: false,
        perimetre: [],
      })
    }),
  )

  it(
    'refuse un périmètre sur une action autre que WRITE_DATA, ou un membre inconnu',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const cible = await fixtures.apiKey()
      const accorder = (action: IndicateurPermissionAction, perimetre: string[]) =>
        runAsAdmin(ADMIN_ID, () =>
          grantIndicateurPermission({
            principalId: cible.id,
            indicateurPublicId: cube.indicateur,
            action,
            perimetre,
          }),
        )

      await expect(accorder(IndicateurPermissionAction.READ, [cube.orange])).rejects.toThrow(
        ValidationError,
      )
      await expect(
        accorder(IndicateurPermissionAction.WRITE_DATA, ['OP-INCONNU']),
      ).rejects.toMatchObject({ details: { individuIds: ['OP-INCONNU'] } })
      expect(await etatPermission(cible.id, cube.indicateur)).toBeNull()
    }),
  )
})

describe.concurrent('PUT /permissions — différentiel', () => {
  it(
    'une permission conservée garde sa restriction et son périmètre',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const autre = await fixtures.indicateur({ nom: 'Autre' })
      const cible = await fixtures.apiKey({
        permissions: [
          { indicateur: { publicId: cube.indicateur }, action: IndicateurPermissionAction.READ },
        ],
      })
      await fixtures.indicateurPermissionPerimetre({
        principalId: cible.id,
        indicateur: { publicId: cube.indicateur },
        membres: [{ publicId: cube.orange }],
      })

      const result = await runAsAdmin(ADMIN_ID, () =>
        replacePrincipalPermissions({
          principalId: cible.id,
          indicateurs: [
            {
              publicId: cube.indicateur,
              actions: [IndicateurPermissionAction.READ, IndicateurPermissionAction.WRITE_DATA],
            },
            { publicId: autre.publicId, actions: [IndicateurPermissionAction.READ] },
          ],
          collections: [],
        }),
      )

      expect(
        result._unsafeUnwrap().indicateurs.find((i) => i.publicId === cube.indicateur),
      ).toMatchObject({ perimetre: [cube.orange] })
      expect(await etatPermission(cible.id, cube.indicateur)).toEqual({
        restreint: true,
        perimetre: [cube.orange],
      })
    }),
  )

  it(
    'retirer WRITE_DATA supprime aussi son périmètre (cascade)',
    integrationTest(async () => {
      const cube = await fixtures.cubeTerritoireOperateur()
      const cible = await fixtures.apiKey()
      await fixtures.indicateurPermissionPerimetre({
        principalId: cible.id,
        indicateur: { publicId: cube.indicateur },
        membres: [{ publicId: cube.orange }],
      })

      await runAsAdmin(ADMIN_ID, () =>
        replacePrincipalPermissions({
          principalId: cible.id,
          indicateurs: [{ publicId: cube.indicateur, actions: [IndicateurPermissionAction.READ] }],
          collections: [],
        }),
      )

      expect(await etatPermission(cible.id, cube.indicateur)).toBeNull()
      expect(
        await db().indicateurPermissionPerimetre.count({ where: { principalId: cible.id } }),
      ).toBe(0)
    }),
  )
})
