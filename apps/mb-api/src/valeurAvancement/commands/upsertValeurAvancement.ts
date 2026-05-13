import {
  type UpsertValeurAvancementBody,
  type ValeurAvancementApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { Decimal } from '@/framework/decimal'
import { AppError, type ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import {
  ensureIndicateurWritePermission,
  withIndicateurReadPermission,
} from '@/indicateur/permissions'
import { toValeurAvancementApiModel } from '@/valeurAvancement/utils'

export class IndividuInconnuError extends AppError {
  readonly code = 'INDIVIDU_INCONNU'
  readonly kind = 'validation' as const
}

type UpsertValeurAvancementParams = {
  indicateurPublicId: string
  body: UpsertValeurAvancementBody
}

const resolveAuthorizedIndividu = ({
  indicateurId,
  individuPublicId,
}: {
  indicateurId: string
  individuPublicId: string
}): ResultAsync<{ id: string; publicId: string }, IndividuInconnuError> => {
  const unknownOrUnauthorized = () =>
    new IndividuInconnuError('Individu inconnu ou non autorisé sur cet indicateur', {
      unknownOrUnauthorizedIndividu: individuPublicId,
    })
  return ResultAsync.fromSafePromise(
    db().individu.findUnique({
      where: { publicId: individuPublicId },
      select: { id: true, publicId: true, referentielId: true },
    }),
  )
    .andThen((individu) => (individu ? okAsync(individu) : errAsync(unknownOrUnauthorized())))
    .andThen((individu) =>
      ResultAsync.fromSafePromise(
        db().indicateurReferentiel.findUnique({
          where: {
            indicateurId_referentielId: {
              indicateurId,
              referentielId: individu.referentielId,
            },
          },
        }),
      ).andThen((link) =>
        link
          ? okAsync({ id: individu.id, publicId: individu.publicId })
          : errAsync(unknownOrUnauthorized()),
      ),
    )
}

export const upsertValeurAvancement = ({
  indicateurPublicId,
  body,
}: UpsertValeurAvancementParams): ResultAsync<
  ValeurAvancementApiModel,
  IndividuInconnuError | ForbiddenError
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
        indicateurId: indicateur.id,
        individuPublicId: body.individu,
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
    .map(toValeurAvancementApiModel)
}
