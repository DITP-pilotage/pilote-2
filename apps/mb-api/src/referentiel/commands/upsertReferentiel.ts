import { type UpsertReferentielBody } from '@pilote/mb-shared/referentiel'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { AppError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'

export class IndividuAlreadyAttachedError extends AppError {
  readonly code = 'INDIVIDU_ALREADY_ATTACHED'
  readonly kind = 'conflict' as const
}

const performUpsert = async (publicId: string, body: UpsertReferentielBody): Promise<void> => {
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
    const existing = await db().individu.findUnique({ where: { publicId: item.publicId } })
    if (existing && existing.referentielId !== referentiel.id) {
      throw new IndividuAlreadyAttachedError(
        `L'individu ${item.publicId} est déjà rattaché à un autre référentiel.`,
        { individuPublicId: item.publicId },
      )
    }
    if (existing) {
      await db().individu.update({ where: { id: existing.id }, data: { nom: item.nom } })
      continue
    }
    await db().individu.create({
      data: {
        id: uuidv7(),
        publicId: item.publicId,
        nom: item.nom,
        referentielId: referentiel.id,
      },
    })
  }
}

export const upsertReferentiel = (
  publicId: string,
  body: UpsertReferentielBody,
): ResultAsync<void, never> => ResultAsync.fromSafePromise(performUpsert(publicId, body))
