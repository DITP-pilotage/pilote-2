import { z } from 'zod'

export const articleCentreAideTypeSchema = z
  .enum(['GROUPE', 'PAGE'])
  .describe('Nature du noeud : GROUPE (dossier) ou PAGE (article).')
export type ArticleCentreAideType = z.infer<typeof articleCentreAideTypeSchema>

export const directionDeplacementSchema = z
  .enum(['monter', 'descendre', 'entrer', 'sortir'])
  .describe('Sens du déplacement dans l’arborescence.')
export type DirectionDeplacement = z.infer<typeof directionDeplacementSchema>

// Modèle admin : expose à la fois les valeurs publiées et les valeurs brouillon.
export const articleCentreAideApiModelSchema = z
  .object({
    id: z.string().uuid().describe('Identifiant de l’article.'),
    type: articleCentreAideTypeSchema,
    parentId: z.string().uuid().nullable().describe('Parent dans l’arbre, ou null à la racine.'),
    ordre: z.number().int().describe('Position parmi les frères.'),
    estPublie: z.boolean().describe('L’article a une version publiée.'),
    estMasque: z.boolean().describe('Masqué du lecteur même si publié.'),
    titre: z.string().describe('Titre publié (clé d’arbre).'),
    titreAffiche: z.string().describe('Titre publié affiché.'),
    contenu: z.string().describe('Corps publié (HTML riche).'),
    titreBrouillon: z.string().describe('Titre brouillon.'),
    titreAfficheBrouillon: z.string().describe('Titre affiché brouillon.'),
    contenuBrouillon: z.string().describe('Corps brouillon (HTML riche).'),
    createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
    updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière modification.'),
    deletedAt: z
      .string()
      .datetime()
      .nullable()
      .describe('Date ISO 8601 de mise en corbeille, ou null si actif.'),
  })
  .describe('Article du centre d’aide (vue admin).')
export type ArticleCentreAideApiModel = z.infer<typeof articleCentreAideApiModelSchema>

export const articleCentreAideListApiModelSchema = z.array(articleCentreAideApiModelSchema)
export type ArticleCentreAideListApiModel = z.infer<typeof articleCentreAideListApiModelSchema>

// Modèle public : uniquement les champs publiés, jamais les brouillons.
export const articleCentreAidePublicApiModelSchema = z
  .object({
    id: z.string().uuid(),
    type: articleCentreAideTypeSchema,
    parentId: z.string().uuid().nullable(),
    ordre: z.number().int(),
    titre: z.string(),
    titreAffiche: z.string(),
    contenu: z.string().describe('Corps publié (HTML riche), pour le rendu.'),
    contenuTexte: z
      .string()
      .describe('Corps publié en texte brut, pour la recherche et l’affichage sans HTML.'),
  })
  .describe('Article du centre d’aide (vue publique, publié uniquement).')
export type ArticleCentreAidePublicApiModel = z.infer<typeof articleCentreAidePublicApiModelSchema>

export const articleCentreAidePublicListApiModelSchema = z.array(
  articleCentreAidePublicApiModelSchema,
)
export type ArticleCentreAidePublicListApiModel = z.infer<
  typeof articleCentreAidePublicListApiModelSchema
>

export const creerArticleCentreAideBodySchema = z
  .object({
    type: articleCentreAideTypeSchema,
    parentId: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .describe('Parent, ou null/absent pour racine.'),
    titre: z.string().min(1).describe('Titre initial de l’article.'),
  })
  .describe('Création d’un noeud (groupe ou page).')
export type CreerArticleCentreAideBody = z.infer<typeof creerArticleCentreAideBodySchema>

export const modifierBrouillonArticleBodySchema = z
  .object({
    titreBrouillon: z.string().optional(),
    titreAfficheBrouillon: z.string().optional(),
    contenuBrouillon: z.string().optional(),
  })
  .describe('Enregistrement du brouillon (titre et/ou contenu).')
export type ModifierBrouillonArticleBody = z.infer<typeof modifierBrouillonArticleBodySchema>

export const basculerVisibiliteArticleBodySchema = z
  .object({ estMasque: z.boolean().describe('Nouvelle valeur de masquage.') })
  .describe('Masquer ou ré-afficher un article publié.')
export type BasculerVisibiliteArticleBody = z.infer<typeof basculerVisibiliteArticleBodySchema>

export const deplacerArticleBodySchema = z
  .object({ direction: directionDeplacementSchema })
  .describe('Déplacement d’un article dans l’arbre.')
export type DeplacerArticleBody = z.infer<typeof deplacerArticleBodySchema>
