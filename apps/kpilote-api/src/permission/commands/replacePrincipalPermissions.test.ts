import { describe, expect, it } from 'vitest'

import { ForbiddenError, NotFoundError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { CollectionPermissionAction, IndicateurPermissionAction } from '@/generated/prisma/enums'
import { replacePrincipalPermissions } from '@/permission/commands/replacePrincipalPermissions'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { runAsAdmin, runAsContributor } from '@/test/runAsPrincipal'

const CALLER_ID = '00000000-0000-0000-0000-0000000000b1'

describe.concurrent('replacePrincipalPermissions', () => {
  it(
    'révoque les permissions des ressources absentes du payload',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const garde = await fixtures.indicateur({ nom: 'Gardé' })
      const retire = await fixtures.indicateur({ nom: 'Retiré' })
      await fixtures.indicateurPermission(
        {
          principalId: target.id,
          indicateur: { publicId: garde.publicId },
          action: IndicateurPermissionAction.READ,
        },
        {
          principalId: target.id,
          indicateur: { publicId: retire.publicId },
          action: IndicateurPermissionAction.READ,
        },
      )

      const result = await runAsAdmin(CALLER_ID, () =>
        replacePrincipalPermissions({
          principalId: target.id,
          collections: [],
          indicateurs: [{ publicId: garde.publicId, actions: [IndicateurPermissionAction.READ] }],
        }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([
        {
          publicId: garde.publicId,
          nom: 'Gardé',
          actions: [IndicateurPermissionAction.READ],
        },
      ])
    }),
  )

  it(
    'ajoute une ressource et en retire une autre dans le même appel',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const sortant = await fixtures.indicateur({ nom: 'Sortant' })
      const entrant = await fixtures.indicateur({ nom: 'Entrant' })
      await fixtures.indicateurPermission({
        principalId: target.id,
        indicateur: { publicId: sortant.publicId },
        action: IndicateurPermissionAction.READ,
      })

      const result = await runAsAdmin(CALLER_ID, () =>
        replacePrincipalPermissions({
          principalId: target.id,
          collections: [],
          indicateurs: [
            {
              publicId: entrant.publicId,
              actions: [IndicateurPermissionAction.READ, IndicateurPermissionAction.WRITE_DATA],
            },
          ],
        }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([
        {
          publicId: entrant.publicId,
          nom: 'Entrant',
          actions: [IndicateurPermissionAction.READ, IndicateurPermissionAction.WRITE_DATA],
        },
      ])
    }),
  )

  it(
    'est idempotent : deux appels identiques donnent le même état',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({ nom: 'Indic' })
      const body = {
        principalId: target.id,
        collections: [],
        indicateurs: [
          {
            publicId: ind.publicId,
            actions: [IndicateurPermissionAction.READ, IndicateurPermissionAction.WRITE_COMMENT],
          },
        ],
      }

      const premier = await runAsAdmin(CALLER_ID, () => replacePrincipalPermissions(body))
      const second = await runAsAdmin(CALLER_ID, () => replacePrincipalPermissions(body))

      expect(second._unsafeUnwrap()).toEqual(premier._unsafeUnwrap())
    }),
  )

  it(
    "accepte une action d'écriture sans READ",
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({ nom: 'Sans lecture' })

      const result = await runAsAdmin(CALLER_ID, () =>
        replacePrincipalPermissions({
          principalId: target.id,
          collections: [],
          indicateurs: [
            { publicId: ind.publicId, actions: [IndicateurPermissionAction.WRITE_DATA] },
          ],
        }),
      )

      expect(result._unsafeUnwrap().indicateurs).toEqual([
        {
          publicId: ind.publicId,
          nom: 'Sans lecture',
          actions: [IndicateurPermissionAction.WRITE_DATA],
        },
      ])
    }),
  )

  it(
    "rejette un publicId inconnu sans toucher à l'état existant",
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const ind = await fixtures.indicateur({ nom: 'Existant' })
      await fixtures.indicateurPermission({
        principalId: target.id,
        indicateur: { publicId: ind.publicId },
        action: IndicateurPermissionAction.READ,
      })

      await expect(
        runAsAdmin(CALLER_ID, () =>
          replacePrincipalPermissions({
            principalId: target.id,
            collections: [],
            indicateurs: [
              { publicId: 'IND-inexistant', actions: [IndicateurPermissionAction.READ] },
            ],
          }),
        ),
      ).rejects.toBeInstanceOf(NotFoundError)

      const restantes = await db().indicateurPermission.count({
        where: { principalId: target.id },
      })
      expect(restantes).toBe(1)
    }),
  )

  it(
    "rejette un indicateur listé deux fois sans toucher à l'état existant",
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const deja = await fixtures.indicateur({ nom: 'Déjà accordé' })
      const doublon = await fixtures.indicateur({ nom: 'En double' })
      await fixtures.indicateurPermission({
        principalId: target.id,
        indicateur: { publicId: deja.publicId },
        action: IndicateurPermissionAction.READ,
      })

      await expect(
        runAsAdmin(CALLER_ID, () =>
          replacePrincipalPermissions({
            principalId: target.id,
            collections: [],
            indicateurs: [
              { publicId: doublon.publicId, actions: [IndicateurPermissionAction.READ] },
              { publicId: doublon.publicId, actions: [IndicateurPermissionAction.WRITE_DATA] },
            ],
          }),
        ),
      ).rejects.toBeInstanceOf(ValidationError)

      const restantes = await db().indicateurPermission.count({
        where: { principalId: target.id },
      })
      expect(restantes).toBe(1)
    }),
  )

  it(
    'rejette une collection listée deux fois',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const collection = await fixtures.collection({ nom: 'En double' })

      await expect(
        runAsAdmin(CALLER_ID, () =>
          replacePrincipalPermissions({
            principalId: target.id,
            collections: [
              { publicId: collection.publicId, actions: [CollectionPermissionAction.READ] },
              {
                publicId: collection.publicId,
                actions: [CollectionPermissionAction.WRITE_COMMENT],
              },
            ],
            indicateurs: [],
          }),
        ),
      ).rejects.toBeInstanceOf(ValidationError)
    }),
  )

  it(
    'rejette une clé non-ADMIN (ForbiddenError)',
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})

      await expect(
        runAsContributor(CALLER_ID, () =>
          replacePrincipalPermissions({
            principalId: target.id,
            collections: [],
            indicateurs: [],
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }),
  )

  it(
    "recalcule les indicateurs hérités après remplacement d'une permission collection",
    integrationTest(async () => {
      const target = await fixtures.utilisateur({})
      const collection = await fixtures.collection({
        nom: 'Ma collection',
        indicateurs: [{ nom: 'Porté par la collection' }],
      })

      const result = await runAsAdmin(CALLER_ID, () =>
        replacePrincipalPermissions({
          principalId: target.id,
          collections: [
            { publicId: collection.publicId, actions: [CollectionPermissionAction.READ] },
          ],
          indicateurs: [],
        }),
      )

      const model = result._unsafeUnwrap()
      expect(model.collections).toHaveLength(1)
      expect(model.indicateursHerites).toHaveLength(1)
      expect(model.indicateursHerites[0]?.viaCollectionPublicId).toBe(collection.publicId)
    }),
  )
})
