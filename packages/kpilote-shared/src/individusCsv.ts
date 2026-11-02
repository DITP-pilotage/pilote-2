import { z } from 'zod'

import { celluleIdSchema } from './cellule'

export const MAX_INDIVIDUS_PAR_REQUETE = 100

export const individusCsvSchema = z
  .string()
  .min(1, "Au moins un identifiant d'individu est requis")
  .transform((value) =>
    value
      .split(',')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0),
  )
  .pipe(
    z
      .array(celluleIdSchema)
      .min(1)
      .max(MAX_INDIVIDUS_PAR_REQUETE, `Au plus ${MAX_INDIVIDUS_PAR_REQUETE} individus par requête`),
  )
