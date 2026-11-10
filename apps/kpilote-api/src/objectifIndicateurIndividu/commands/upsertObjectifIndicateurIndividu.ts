import {
  type ObjectifIndicateurIndividuApiModel,
  type UpsertObjectifIndicateurIndividuBody,
} from '@pilote/kpilote-shared/objectifIndicateurIndividu'
import { ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { type ErreurCellule, resoudreCelluleEcriture } from '@/dimension/celluleEcriture'
import { Decimal } from '@/framework/decimal'
import { db } from '@/framework/persistence/dbStore'
import { resolveIndicateurForWriteData } from '@/indicateur/resolveIndicateurForWrite'
import { toObjectifIndicateurIndividuApiModel } from '@/objectifIndicateurIndividu/utils'

export type UpsertObjectifIndicateurIndividuError = ErreurCellule

type UpsertObjectifIndicateurIndividuParams = {
  indicateurPublicId: string
  body: UpsertObjectifIndicateurIndividuBody
}

// Un objectif se saisit sur une cellule feuille du sous-cube des objectifs
// (dimensions `porteObjectifs`), cf. dimensions-design.md.
export const upsertObjectifIndicateurIndividu = ({
  indicateurPublicId,
  body,
}: UpsertObjectifIndicateurIndividuParams): ResultAsync<
  ObjectifIndicateurIndividuApiModel,
  UpsertObjectifIndicateurIndividuError
> =>
  resolveIndicateurForWriteData({ indicateurPublicId }).andThen(({ indicateur, principalId }) =>
    resoudreCelluleEcriture({
      indicateurId: indicateur.id,
      principalId,
      sousCube: 'objectifs',
      cible: body,
      creer: true,
    }).andThen(({ celluleId, publicId }) =>
      ResultAsync.fromSafePromise(
        db().objectifIndicateurIndividu.upsert({
          where: {
            objectif_indicateur_individu_unique: {
              indicateurId: indicateur.id,
              celluleId: celluleId!,
              dateCible: body.dateCible,
            },
          },
          update: { valeurCible: new Decimal(body.valeurCible) },
          create: {
            id: uuidv7(),
            indicateurId: indicateur.id,
            celluleId: celluleId!,
            dateCible: body.dateCible,
            valeurCible: new Decimal(body.valeurCible),
          },
        }),
      ).map((objectif) =>
        toObjectifIndicateurIndividuApiModel({
          objectif,
          indicateurPublicId: indicateur.publicId,
          celluleId: publicId,
        }),
      ),
    ),
  )
