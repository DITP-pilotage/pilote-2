import { type UpsertIndicateurBody } from '@pilote/mb-shared/indicateur'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ForbiddenError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'

type UpsertIndicateurParams = {
  publicId: string
  body: UpsertIndicateurBody
}

const resolveReferentielIds = async (publicIds: readonly string[]): Promise<string[]> => {
  const unique = [...new Set(publicIds)]
  if (unique.length === 0) return []
  const found = await db().referentiel.findMany({
    where: { publicId: { in: unique } },
    select: { id: true, publicId: true },
  })
  const foundPublicIds = new Set(found.map((r) => r.publicId))
  const unknown = unique.filter((id) => !foundPublicIds.has(id))
  if (unknown.length > 0) {
    throw new ValidationError('Référentiels inconnus', {
      unknownReferentielIds: unknown.sort(),
    })
  }
  return found.map((r) => r.id)
}

const replaceReferentielLinks = async (
  indicateurId: string,
  referentielIds: string[],
): Promise<void> => {
  const existing = await db().indicateurReferentiel.findMany({
    where: { indicateurId },
    select: { referentielId: true },
  })
  const existingSet = new Set(existing.map((link) => link.referentielId))
  const desiredSet = new Set(referentielIds)

  const toAdd = referentielIds.filter((id) => !existingSet.has(id))
  const toRemove = [...existingSet].filter((id) => !desiredSet.has(id))

  if (toRemove.length > 0) {
    await db().indicateurReferentiel.deleteMany({
      where: { indicateurId, referentielId: { in: toRemove } },
    })
  }
  if (toAdd.length > 0) {
    await db().indicateurReferentiel.createMany({
      data: toAdd.map((referentielId) => ({ indicateurId, referentielId })),
    })
  }
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
  const referentielIds = await resolveReferentielIds(body.referentielIds)
  await db().indicateur.update({ where: { publicId }, data: { nom: body.nom } })
  await replaceReferentielLinks(indicateurId, referentielIds)
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
  const referentielIds = await resolveReferentielIds(body.referentielIds)
  const id = uuidv7()
  await db().indicateur.create({ data: { id, publicId, nom: body.nom } })
  await db().indicateurPermission.createMany({
    data: [
      { principalId, indicateurId: id, action: PermissionAction.READ },
      { principalId, indicateurId: id, action: PermissionAction.WRITE },
    ],
  })
  if (referentielIds.length > 0) {
    await db().indicateurReferentiel.createMany({
      data: referentielIds.map((referentielId) => ({ indicateurId: id, referentielId })),
    })
  }
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
