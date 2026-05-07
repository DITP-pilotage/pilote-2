import { type ReferentielApiModel, type UpsertReferentielBody } from '@pilote/mb-shared/referentiel'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { db } from '@/framework/persistence/dbStore'
import { toReferentielApiModel, type ReferentielWithCount } from '@/referentiel/utils'

const performUpsert = async (
  publicId: string,
  body: UpsertReferentielBody,
): Promise<ReferentielWithCount> => {
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
    const individu = await db().individu.upsert({
      where: { publicId: item.publicId },
      update: { nom: item.nom },
      create: { id: uuidv7(), publicId: item.publicId, nom: item.nom },
    })
    await db().referentielIndividu.upsert({
      where: {
        referentielId_individuId: {
          referentielId: referentiel.id,
          individuId: individu.id,
        },
      },
      update: {},
      create: { referentielId: referentiel.id, individuId: individu.id },
    })
  }

  return db().referentiel.findUniqueOrThrow({
    where: { id: referentiel.id },
    include: { _count: { select: { individus: true } } },
  })
}

export const upsertReferentiel = (
  publicId: string,
  body: UpsertReferentielBody,
): ResultAsync<ReferentielApiModel, never> =>
  ResultAsync.fromSafePromise(performUpsert(publicId, body)).map(toReferentielApiModel)
