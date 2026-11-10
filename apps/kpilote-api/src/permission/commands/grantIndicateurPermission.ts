import {
  type GrantIndicateurPermissionBody,
  type PrincipalPermissionsApiModel,
} from '@pilote/kpilote-shared/permission'
import { ResultAsync } from 'neverthrow'

import { ensurePrincipal, isApiKeyAdmin } from '@/framework/auth/principalPredicates'
import { ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { loadPrincipalPermissions } from '@/permission/queries/loadPrincipalPermissions'

const performGrant = async (
  body: GrantIndicateurPermissionBody,
): Promise<PrincipalPermissionsApiModel> => {
  ensurePrincipal(isApiKeyAdmin, 'Cette opération requiert une clé API de rôle ADMIN')
  await db().principal.findUniqueOrThrow({ where: { id: body.principalId } })
  const indicateur = await db().indicateur.findUniqueOrThrow({
    where: { publicId: body.indicateurPublicId },
    select: { id: true },
  })

  if (body.perimetre !== undefined && body.action !== 'WRITE_DATA') {
    throw new ValidationError('Le périmètre ne s’applique qu’à WRITE_DATA', {})
  }
  const membres =
    body.perimetre && body.perimetre.length > 0
      ? await db().individu.findMany({
          where: { publicId: { in: body.perimetre } },
          select: { id: true, publicId: true },
        })
      : []
  const inconnus = (body.perimetre ?? []).filter((id) => !membres.some((m) => m.publicId === id))
  if (inconnus.length > 0) {
    throw new ValidationError('Membres de périmètre inconnus', { individuIds: inconnus.sort() })
  }

  // Droit et périmètre posés dans la même transaction (la route l'enveloppe) :
  // pas de fenêtre où le droit existerait sans sa restriction.
  const cle = { principalId: body.principalId, indicateurId: indicateur.id, action: body.action }
  const restriction =
    body.perimetre === undefined ? {} : { perimetreRestreint: body.perimetre !== null }
  await db().indicateurPermission.upsert({
    where: { principalId_indicateurId_action: cle },
    create: { ...cle, ...restriction },
    update: restriction,
  })
  if (body.perimetre !== undefined) {
    await db().indicateurPermissionPerimetre.deleteMany({ where: cle })
    if (membres.length > 0) {
      await db().indicateurPermissionPerimetre.createMany({
        data: membres.map((membre) => ({ ...cle, individuId: membre.id })),
      })
    }
  }

  return loadPrincipalPermissions(body.principalId)
}

export const grantIndicateurPermission = (
  body: GrantIndicateurPermissionBody,
): ResultAsync<PrincipalPermissionsApiModel, never> =>
  ResultAsync.fromSafePromise(performGrant(body))
