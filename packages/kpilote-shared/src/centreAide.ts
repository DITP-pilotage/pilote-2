import { z } from 'zod'

export const articleCentreAideTypeSchema = z
  .enum(['GROUPE', 'PAGE'])
  .describe('Nature du noeud : GROUPE (dossier) ou PAGE (article).')
export type ArticleCentreAideType = z.infer<typeof articleCentreAideTypeSchema>

export const articleCentreAideStatutSchema = z
  .enum(['ACTIF', 'CORBEILLE'])
  .describe('Cycle de vie : ACTIF, ou CORBEILLE (en attente de suppression définitive).')
export type ArticleCentreAideStatut = z.infer<typeof articleCentreAideStatutSchema>

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
    statut: articleCentreAideStatutSchema,
    createdAt: z.string().datetime().describe('Date ISO 8601 de création.'),
    updatedAt: z.string().datetime().describe('Date ISO 8601 de dernière modification.'),
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

// Mutation unique et idempotente : le payload porte tout l'état éditable de l'article et l'écrase.
// Les champs publiés (titre/titreAffiche/contenu) sont possédés par le client ; le serveur ne
// dérive que contenuTexte. La position (parentId/ordre) est réindexée parmi les frères côté serveur.
export const modifierArticleBodySchema = z
  .object({
    titreBrouillon: z.string().describe('Titre brouillon.'),
    titreAfficheBrouillon: z.string().describe('Titre affiché brouillon.'),
    contenuBrouillon: z.string().describe('Corps brouillon (HTML riche).'),
    titre: z.string().describe('Titre publié (clé d’arbre).'),
    titreAffiche: z.string().describe('Titre publié affiché.'),
    contenu: z.string().describe('Corps publié (HTML riche).'),
    parentId: z.string().uuid().nullable().describe('Parent (un groupe), ou null pour la racine.'),
    ordre: z.number().int().min(0).describe('Position parmi les frères du parent cible.'),
    estMasque: z.boolean().describe('Masqué du lecteur même si publié.'),
    estPublie: z.boolean().describe('L’article a une version publiée.'),
    statut: articleCentreAideStatutSchema,
  })
  .describe('Remplacement complet de l’état éditable d’un article.')
export type ModifierArticleBody = z.infer<typeof modifierArticleBodySchema>

// Projette le modèle admin vers un payload de mutation complet : base pour construire un PUT
// en ne surchargeant que le(s) champ(s) réellement modifié(s).
export const articleVersModification = (
  article: ArticleCentreAideApiModel,
): ModifierArticleBody => ({
  titreBrouillon: article.titreBrouillon,
  titreAfficheBrouillon: article.titreAfficheBrouillon,
  contenuBrouillon: article.contenuBrouillon,
  titre: article.titre,
  titreAffiche: article.titreAffiche,
  contenu: article.contenu,
  parentId: article.parentId,
  ordre: article.ordre,
  estMasque: article.estMasque,
  estPublie: article.estPublie,
  statut: article.statut,
})
