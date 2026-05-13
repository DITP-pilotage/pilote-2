import { type UpsertReferentielBody } from '@pilote/mb-shared/referentiel'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { db } from '@/framework/persistence/dbStore'

export type UpsertReferentielError = {
  type: 'INDIVIDUS_ALREADY_ATTACHED'
  individuIds: string[]
}

const detectConflicts = async (
  referentielId: string | undefined,
  individuPublicIds: string[],
): Promise<string[]> => {
  if (individuPublicIds.length === 0) return []
  const conflicts = await db().individu.findMany({
    where: {
      publicId: { in: individuPublicIds },
      ...(referentielId ? { referentielId: { not: referentielId } } : {}),
    },
    select: { publicId: true },
    orderBy: { publicId: 'asc' },
  })
  return conflicts.map((row) => row.publicId)
}

const performUpsert = async (
  publicId: string,
  body: UpsertReferentielBody,
): Promise<Result<void, UpsertReferentielError>> => {
  const existingReferentiel = await db().referentiel.findUnique({
    where: { publicId },
    select: { id: true },
  })

  const individuPublicIds = body.individus?.map((i) => i.publicId) ?? []
  const conflicts = await detectConflicts(existingReferentiel?.id, individuPublicIds)
  if (conflicts.length > 0) {
    return err({ type: 'INDIVIDUS_ALREADY_ATTACHED', individuIds: conflicts })
  }

  const referentiel = await db().referentiel.upsert({
    where: { publicId },
    update: { nom: body.nom, description: body.description },
    create: {
      id: uuidv7(),
      publicId,
      nom: body.nom,
      description: body.description,
    },
  })

  for (const item of body.individus ?? []) {
    await db().individu.upsert({
      where: { publicId: item.publicId },
      update: { nom: item.nom },
      create: {
        id: uuidv7(),
        publicId: item.publicId,
        nom: item.nom,
        referentielId: referentiel.id,
      },
    })
  }

  return ok()
}

export const upsertReferentiel = (
  publicId: string,
  body: UpsertReferentielBody,
): ResultAsync<void, UpsertReferentielError> =>
  ResultAsync.fromSafePromise(performUpsert(publicId, body)).andThen((r) => r)
