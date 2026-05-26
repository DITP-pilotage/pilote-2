import {
  type ObjectifAvancementApiModel,
  type UpsertObjectifAvancementBody,
} from '@pilote/mb-shared/objectifAvancement'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError, resolveAuthorizedIndividu } from '@/individu/permission'
import {
  ensureIndicateurWritePermission,
  withIndicateurReadPermission,
} from '@/indicateur/permissions'
import { toObjectifAvancementApiModel } from '@/objectifAvancement/utils'

export type UpsertObjectifAvancementError = IndividuInconnuError

type UpsertObjectifAvancementParams = {
  indicateurPublicId: string
  body: UpsertObjectifAvancementBody
}

export const upsertObjectifAvancement = ({
  indicateurPublicId,
  body,
}: UpsertObjectifAvancementParams): ResultAsync<
  ObjectifAvancementApiModel,
  UpsertObjectifAvancementError
> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    db().indicateur.findFirstOrThrow({
      where: withIndicateurReadPermission({ publicId: indicateurPublicId }, principalId),
      select: { id: true, publicId: true },
    }),
  )
    .andThen((indicateur) =>
      ensureIndicateurWritePermission({ indicateurId: indicateur.id, principalId }).map(
        () => indicateur,
      ),
    )
    .andThen((indicateur) =>
      resolveAuthorizedIndividu({
        individuPublicId: body.individu,
        indicateurId: indicateur.id,
      }).map((individu) => ({ indicateur, individu })),
    )
    .andThen(({ indicateur, individu }) =>
      ResultAsync.fromSafePromise(
        db().objectifAvancement.upsert({
          where: {
            objectif_avancement_unique: {
              indicateurId: indicateur.id,
              individuId: individu.id,
              date: body.date,
            },
          },
          update: { valeur: new Decimal(body.valeur) },
          create: {
            indicateurId: indicateur.id,
            individuId: individu.id,
            date: body.date,
            valeur: new Decimal(body.valeur),
          },
          include: {
            indicateur: { select: { publicId: true } },
            individu: { select: { publicId: true } },
          },
        }),
      ),
    )
    .map(toObjectifAvancementApiModel)
}
