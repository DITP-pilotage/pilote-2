import { ResultAsync } from 'neverthrow'

import {
  type DimensionIndicateur,
  loadIndicateurDimensions,
} from '@/dimension/queries/loadIndicateurDimensions'
import { db } from '@/framework/persistence/dbStore'

// Dimensions de l'indicateur (triées par `ordre`), pour rattacher chaque colonne
// d'identité d'un fichier importé à une dimension. L'accès en lecture est déjà
// contrôlé en amont (getIndicateurByPublicId).
export const listDimensionsForIndicateur = (
  indicateurPublicId: string,
): ResultAsync<DimensionIndicateur[], never> =>
  ResultAsync.fromSafePromise(
    db()
      .indicateur.findUniqueOrThrow({ where: { publicId: indicateurPublicId } })
      .then((indicateur) => loadIndicateurDimensions(indicateur.id)),
  )
