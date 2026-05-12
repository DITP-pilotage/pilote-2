import { type UpsertIndicateurBody } from '@pilote/mb-shared/indicateur'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'

type UpsertIndicateurParams = {
  publicId: string
  body: UpsertIndicateurBody
}

const assertWritePermission = async ({
  indicateurId,
  principalId,
}: {
  indicateurId: string
  principalId: string
}): Promise<void> => {
  const hasWrite = await db().indicateurPermission.findUnique({
    where: {
      principalId_indicateurId_action: {
        principalId,
        indicateurId,
        action: PermissionAction.WRITE,
      },
    },
  })
  if (!hasWrite) {
    throw new ForbiddenError("Vous n'avez pas la permission de modifier cet indicateur")
  }
}

const updateExisting = async ({
  publicId,
  indicateurId,
  body,
  principalId,
}: {
  publicId: string
  indicateurId: string
  body: UpsertIndicateurBody
  principalId: string
}): Promise<void> => {
  await assertWritePermission({ indicateurId, principalId })
  await db().indicateur.update({ where: { publicId }, data: { nom: body.nom } })
}

const createWithGrants = async ({
  publicId,
  body,
  principalId,
}: {
  publicId: string
  body: UpsertIndicateurBody
  principalId: string
}): Promise<void> => {
  const id = uuidv7()
  await db().indicateur.create({ data: { id, publicId, nom: body.nom } })
  await db().indicateurPermission.createMany({
    data: [
      { principalId, indicateurId: id, action: PermissionAction.READ },
      { principalId, indicateurId: id, action: PermissionAction.WRITE },
    ],
  })
}

const performUpsert = async ({ publicId, body }: UpsertIndicateurParams): Promise<void> => {
  const principalId = requireCurrentPrincipalId()
  const existing = await db().indicateur.findUnique({ where: { publicId } })
  if (existing) {
    await updateExisting({ publicId, indicateurId: existing.id, body, principalId })
    return
  }
  await createWithGrants({ publicId, body, principalId })
}

export const upsertIndicateur = (params: UpsertIndicateurParams): ResultAsync<void, never> =>
  ResultAsync.fromSafePromise(performUpsert(params))
