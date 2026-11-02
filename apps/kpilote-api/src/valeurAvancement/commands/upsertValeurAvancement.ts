import {
  type UpsertValeurAvancementBody,
  type ValeurSaisieApiModel,
} from '@pilote/kpilote-shared/valeurAvancement'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { type ErreurCellule, resoudreCelluleEcriture } from '@/dimension/celluleEcriture'
import { Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { resolveIndicateurForWriteData } from '@/indicateur/resolveIndicateurForWrite'
import { toValeurSaisieApiModel } from '@/valeurAvancement/utils'

export type UpsertValeurAvancementError = ErreurCellule

type UpsertValeurAvancementParams = {
  indicateurPublicId: string
  body: UpsertValeurAvancementBody
}

export const upsertValeurAvancement = ({
  indicateurPublicId,
  body,
}: UpsertValeurAvancementParams): ResultAsync<ValeurSaisieApiModel, UpsertValeurAvancementError> =>
  resolveIndicateurForWriteData({ indicateurPublicId }).andThen(({ indicateur, principalId }) =>
    resoudreCelluleEcriture({
      indicateurId: indicateur.id,
      principalId,
      sousCube: 'valeurs',
      cible: body,
      creer: true,
    }).andThen(({ celluleId, publicId }) =>
      ResultAsync.fromSafePromise(
        db().valeurAvancement.upsert({
          where: {
            valeur_avancement_unique: {
              indicateurId: indicateur.id,
              celluleId: celluleId!,
              date: body.date,
            },
          },
          update: { valeur: new Decimal(body.valeur) },
          create: {
            id: uuidv7(),
            indicateurId: indicateur.id,
            celluleId: celluleId!,
            date: body.date,
            valeur: new Decimal(body.valeur),
          },
        }),
      ).map((valeur) =>
        toValeurSaisieApiModel({
          valeur,
          indicateurPublicId: indicateur.publicId,
          celluleId: publicId,
        }),
      ),
    ),
  )
