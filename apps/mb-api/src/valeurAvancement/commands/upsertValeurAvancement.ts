import {
  type UpsertValeurAvancementBody,
  type ValeurAvancementApiModel,
} from '@pilote/mb-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { Decimal } from '@/framework/decimal'
import { EntityNotFoundError, ForbiddenError, ValidationError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { PermissionAction } from '@/generated/prisma/enums'
import { toValeurAvancementApiModel } from '@/valeurAvancement/utils'

type UpsertValeurAvancementParams = {
  indicateurPublicId: string
  body: UpsertValeurAvancementBody
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

const resolveAuthorizedIndividu = async ({
  indicateurId,
  individuPublicId,
}: {
  indicateurId: string
  individuPublicId: string
}): Promise<{ id: string; publicId: string }> => {
  const individu = await db().individu.findUnique({
    where: { publicId: individuPublicId },
    select: { id: true, publicId: true, referentielId: true },
  })
  if (!individu) {
    throw new ValidationError('Individu inconnu ou non autorisé sur cet indicateur', {
      unknownOrUnauthorizedIndividu: individuPublicId,
    })
  }
  const link = await db().indicateurReferentiel.findUnique({
    where: {
      indicateurId_referentielId: {
        indicateurId,
        referentielId: individu.referentielId,
      },
    },
  })
  if (!link) {
    throw new ValidationError('Individu inconnu ou non autorisé sur cet indicateur', {
      unknownOrUnauthorizedIndividu: individuPublicId,
    })
  }
  return { id: individu.id, publicId: individu.publicId }
}

const performUpsert = async ({
  indicateurPublicId,
  body,
}: UpsertValeurAvancementParams): Promise<ValeurAvancementApiModel> => {
  const principalId = requireCurrentPrincipalId()
  const indicateur = await db().indicateur.findUnique({
    where: { publicId: indicateurPublicId },
    select: { id: true, publicId: true },
  })
  if (!indicateur) {
    throw new EntityNotFoundError('Indicateur introuvable')
  }
  await assertWritePermission({ indicateurId: indicateur.id, principalId })
  const individu = await resolveAuthorizedIndividu({
    indicateurId: indicateur.id,
    individuPublicId: body.individu,
  })
  const valeur = new Decimal(body.valeur)
  const row = await db().valeurAvancement.upsert({
    where: {
      valeur_avancement_unique: {
        indicateurId: indicateur.id,
        individuId: individu.id,
        date: body.date,
      },
    },
    update: { valeur },
    create: {
      id: uuidv7(),
      indicateurId: indicateur.id,
      individuId: individu.id,
      date: body.date,
      valeur,
    },
    include: {
      indicateur: { select: { publicId: true } },
      individu: { select: { publicId: true } },
    },
  })
  return toValeurAvancementApiModel(row)
}

export const upsertValeurAvancement = (
  params: UpsertValeurAvancementParams,
): ResultAsync<ValeurAvancementApiModel, never> =>
  ResultAsync.fromSafePromise(performUpsert(params))
