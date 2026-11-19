import { type UpsertReferentielBody } from '@pilote/kpilote-shared/referentiel'
import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { ensureAdminOrOidcUser } from '@/framework/auth/principalPredicates'
import { db } from '@/framework/persistence/dbStore'
import { checkIndividusLibres, type IndividusDejaRattachesError } from '@/referentiel/rules'

export type UpsertReferentielError = IndividusDejaRattachesError

const performUpsert = async (
  publicId: string,
  body: UpsertReferentielBody,
): Promise<Result<void, UpsertReferentielError>> => {
  ensureAdminOrOidcUser()

  const existant = await db().referentiel.findUnique({ where: { publicId }, select: { id: true } })
  const individusExistants = await db().individu.findMany({
    where: { publicId: { in: body.individus?.map((individu) => individu.publicId) ?? [] } },
    select: { publicId: true, referentielId: true },
  })

  const libres = checkIndividusLibres({
    referentielId: existant?.id ?? null,
    individusExistants,
  })
  if (libres.isErr()) return err(libres.error)

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
): ResultAsync<void, UpsertReferentielError> => new ResultAsync(performUpsert(publicId, body))
