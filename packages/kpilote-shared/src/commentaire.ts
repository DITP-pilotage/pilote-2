import { z } from 'zod'

import { auteurApiModelSchema } from './auteur'
import { createPaginatedApiListSchema, pageSizeSchema, paginationCursorSchema } from './pagination'

export const commentaireStatutSchema = z
  .enum(['BROUILLON', 'PUBLIE'])
  .describe('Statut du commentaire : BROUILLON (en cours de rédaction) ou PUBLIE (visible).')
export type CommentaireStatut = z.infer<typeof commentaireStatutSchema>

// Enums `type` par sujet (chaque sujet a ses propres valeurs).
export const indicateurIndividuCommentaireTypeSchema = z.enum(['DEFAUT', 'CONFIANCE'])
export const collectionCommentaireTypeSchema = z.enum(['DEFAUT', 'CONFIANCE', 'OBJECTIF'])

export const commentaireApiModelSchema = z
  .object({
    id: z.string().uuid().describe('Identifiant du commentaire.'),
    type: z.string().describe('Catégorie du commentaire (enum propre au sujet).'),
    individuId: z
      .string()
      .nullable()
      .describe(
        'Identifiant public de l’individu rattaché, ou null pour un commentaire global de collection.',
      ),
    contenu: z.string().describe('Contenu HTML riche (peut être vide).'),
    statut: commentaireStatutSchema,
    auteurCreation: auteurApiModelSchema,
    auteurModification: auteurApiModelSchema,
    createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
    updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière modification.'),
  })
  .describe('Commentaire.')
export type CommentaireApiModel = z.infer<typeof commentaireApiModelSchema>

// Body de création : `type` est contraint par le sujet (cf. factory ci-dessous).
const creerCommentaireBodySchema = <T extends z.ZodTypeAny>(typeSchema: T) =>
  z.object({
    type: typeSchema.describe('Catégorie du commentaire.'),
    contenu: z.string().describe('Contenu HTML riche (la chaîne vide est autorisée).'),
    statut: commentaireStatutSchema,
  })

export const creerIndicateurIndividuCommentaireBodySchema = creerCommentaireBodySchema(
  indicateurIndividuCommentaireTypeSchema,
)
export const creerCollectionCommentaireBodySchema = creerCommentaireBodySchema(
  collectionCommentaireTypeSchema,
)
// `type` est paramétré par sujet (cf. schémas ci-dessus) ; le générique permet
// au consommateur de fixer l'enum exact attendu (sinon `string`).
export type CreerCommentaireBody<T extends string = string> = {
  type: T
  contenu: string
  statut: CommentaireStatut
}

// Body de modification (socle, par id) : type non modifiable, individu/sujet figés.
export const modifierCommentaireBodySchema = z
  .object({
    contenu: z.string().optional().describe('Nouveau contenu HTML (optionnel).'),
    statut: commentaireStatutSchema.optional().describe('Nouveau statut (optionnel).'),
  })
  .describe('Modification du contenu et/ou du statut d’un commentaire.')
export type ModifierCommentaireBody = z.infer<typeof modifierCommentaireBodySchema>

// Query de listing : `type` obligatoire, contraint par le sujet (cf. factory ci-dessous).
// Le listing ne renvoie que les commentaires PUBLIE (tous auteurs). Les brouillons
// passent par un endpoint dédié (`/commentaires/brouillon`).
const listerCommentairesQuerySchema = <T extends z.ZodTypeAny>(typeSchema: T) =>
  z.object({
    type: typeSchema.describe('Catégorie du commentaire.'),
    cursor: paginationCursorSchema.optional(),
    pageSize: pageSizeSchema,
  })

export const listerIndicateurIndividuCommentairesQuerySchema = listerCommentairesQuerySchema(
  indicateurIndividuCommentaireTypeSchema,
)
export const listerCollectionCommentairesQuerySchema = listerCommentairesQuerySchema(
  collectionCommentaireTypeSchema,
)
// Type « élargi » consommé par la couche générique : le `type` est déjà validé
// par le schéma propre au sujet (route).
export type ListerCommentairesQuery = {
  type: string
  cursor?: string | undefined
  pageSize?: number | undefined
}

// Query du brouillon courant (par sujet) : juste le type.
const recupererBrouillonQuerySchema = <T extends z.ZodTypeAny>(typeSchema: T) =>
  z.object({ type: typeSchema.describe('Catégorie du commentaire.') })

export const recupererIndicateurIndividuBrouillonQuerySchema = recupererBrouillonQuerySchema(
  indicateurIndividuCommentaireTypeSchema,
)
export const recupererCollectionBrouillonQuerySchema = recupererBrouillonQuerySchema(
  collectionCommentaireTypeSchema,
)
export type RecupererBrouillonQuery = { type: string }

// Réponse du brouillon : le commentaire, ou null s'il n'y en a pas.
export const brouillonApiModelSchema = commentaireApiModelSchema
  .nullable()
  .describe("Brouillon courant de l'utilisateur, ou null s'il n'en a pas.")
export type BrouillonApiModel = z.infer<typeof brouillonApiModelSchema>

export const commentaireListApiModelSchema = createPaginatedApiListSchema(commentaireApiModelSchema)
export type CommentaireListApiModel = z.infer<typeof commentaireListApiModelSchema>
