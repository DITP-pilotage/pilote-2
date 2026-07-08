import { z } from 'zod'

import { auteurApiModelSchema } from './auteur'
import { commentaireApiModelSchema } from './commentaire'
import { createPaginatedApiListSchema } from './pagination'

export const indiceConfianceSchema = z
  .enum(['OBJECTIF_COMPROMIS', 'APPUIS_NECESSAIRE', 'OBJECTIF_ATTEIGNABLE', 'OBJECTIF_SECURISE'])
  .describe('Indice de confiance (état d’avancement vis-à-vis des objectifs).')
export type IndiceConfiance = z.infer<typeof indiceConfianceSchema>

export const niveauConfianceApiModelSchema = z
  .object({
    id: z.string().uuid().describe('Identifiant du niveau de confiance.'),
    indice: indiceConfianceSchema,
    commentaire: commentaireApiModelSchema.describe('Commentaire CONFIANCE qui justifie l’indice.'),
    auteurCreation: auteurApiModelSchema,
    auteurModification: auteurApiModelSchema,
    createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
    updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière modification.'),
  })
  .describe('Niveau de confiance attaché à un commentaire CONFIANCE.')
export type NiveauConfianceApiModel = z.infer<typeof niveauConfianceApiModelSchema>

export const creerNiveauConfianceBodySchema = z
  .object({
    commentaireId: z.string().uuid().describe('Identifiant du commentaire CONFIANCE déjà créé.'),
    indice: indiceConfianceSchema,
  })
  .describe('Création d’un niveau de confiance.')
export type CreerNiveauConfianceBody = z.infer<typeof creerNiveauConfianceBodySchema>

export const modifierNiveauConfianceBodySchema = z
  .object({
    indice: indiceConfianceSchema,
  })
  .describe('Modification d’un niveau de confiance (indice).')
export type ModifierNiveauConfianceBody = z.infer<typeof modifierNiveauConfianceBodySchema>

// Query batch : récupère les niveaux des commentaires passés (CSV d'UUID).
export const listerNiveauxConfianceQuerySchema = z.object({
  commentaires: z
    .preprocess((val) => {
      if (typeof val !== 'string') return val
      const parts = val
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
      return parts
    }, z.array(z.string().uuid()).default([]))
    .describe(
      'Identifiants des commentaires concernés (CSV, ex. `uuid1,uuid2`). Vide = aucun résultat.',
    ),
})
export type ListerNiveauxConfianceQuery = z.infer<typeof listerNiveauxConfianceQuerySchema>

export const niveauConfianceListApiModelSchema = createPaginatedApiListSchema(
  niveauConfianceApiModelSchema,
)
export type NiveauConfianceListApiModel = z.infer<typeof niveauConfianceListApiModelSchema>
