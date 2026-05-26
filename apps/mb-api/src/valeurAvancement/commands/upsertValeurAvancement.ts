import {
  type UpsertValeurAvancementBody,
  type ValeurSaisieApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { type IndividuInconnuError, resolveAuthorizedIndividu } from '@/individu/permission'
import {
  ensureIndicateurWritePermission,
  withIndicateurReadPermission,
} from '@/indicateur/permissions'
import { toValeurSaisieApiModel } from '@/valeurAvancement/utils'

export type UpsertValeurAvancementError = IndividuInconnuError

type UpsertValeurAvancementParams = {
  indicateurPublicId: string
  body: UpsertValeurAvancementBody
}

export const upsertValeurAvancement = ({
  indicateurPublicId,
  body,
}: UpsertValeurAvancementParams): ResultAsync<ValeurSaisieApiModel, UpsertValeurAvancementError> => {
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
        db().valeurAvancement.upsert({
          where: {
            valeur_avancement_unique: {
              indicateurId: indicateur.id,
              individuId: individu.id,
              date: body.date,
            },
          },
          update: { valeur: new Decimal(body.valeur) },
          create: {
            id: uuidv7(),
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
    .map(toValeurSaisieApiModel)
}
