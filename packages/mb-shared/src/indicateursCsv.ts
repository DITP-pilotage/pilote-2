import { z } from 'zod'

import { indicateurPublicIdSchema } from './publicIds'

export const MAX_INDICATEURS_PAR_REQUETE = 100

export const indicateursCsvSchema = z
  .string()
  .min(1, "Au moins un identifiant d'indicateur est requis")
  .transform((value) =>
    value
      .split(',')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0),
  )
  .pipe(
    z
      .array(indicateurPublicIdSchema)
      .min(1)
      .max(
        MAX_INDICATEURS_PAR_REQUETE,
        `Au plus ${MAX_INDICATEURS_PAR_REQUETE} indicateurs par requête`,
      ),
  )
