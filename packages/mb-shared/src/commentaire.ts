import { z } from "zod";

import {
  createPaginatedApiListSchema,
  pageSizeSchema,
  paginationCursorSchema,
} from "./pagination";

export const commentaireStatutSchema = z
  .enum(["BROUILLON", "PUBLIE"])
  .describe(
    "Statut du commentaire : BROUILLON (en cours de rédaction) ou PUBLIE (visible).",
  );
export type CommentaireStatut = z.infer<typeof commentaireStatutSchema>;

// Enums `type` par sujet (chaque sujet a ses propres valeurs).
export const indicateurIndividuCommentaireTypeSchema = z.enum([
  "DEFAUT",
  "CONFIANCE",
]);
export const panierIndividuCommentaireTypeSchema = z.enum([
  "DEFAUT",
  "CONFIANCE",
]);
export const panierCommentaireTypeSchema = z.enum([
  "DEFAUT",
  "CONFIANCE",
  "OBJECTIF",
]);

const auteurUtilisateurApiModelSchema = z.object({
  type: z.literal("utilisateur"),
  id: z.string().uuid().describe("Identifiant du principal."),
  email: z.string().email().describe("Email de l’utilisateur."),
});

const auteurApiKeyApiModelSchema = z.object({
  type: z.literal("apiKey"),
  id: z.string().uuid().describe("Identifiant du principal."),
  label: z.string().describe("Libellé de la clé API."),
});

const auteurApiModelSchema = z
  .discriminatedUnion("type", [
    auteurUtilisateurApiModelSchema,
    auteurApiKeyApiModelSchema,
  ])
  .describe("Auteur d’un commentaire (utilisateur ou clé API).");

export const commentaireApiModelSchema = z
  .object({
    id: z.string().uuid().describe("Identifiant du commentaire."),
    type: z
      .string()
      .describe("Catégorie du commentaire (enum propre au sujet)."),
    individuId: z
      .string()
      .nullable()
      .describe(
        "Identifiant public de l’individu rattaché, ou null pour un commentaire global de panier.",
      ),
    contenu: z.string().describe("Contenu HTML riche (peut être vide)."),
    statut: commentaireStatutSchema,
    auteurCreation: auteurApiModelSchema,
    auteurModification: auteurApiModelSchema,
    createdAt: z.string().datetime().describe("Date ISO 8601 de création."),
    updatedAt: z
      .string()
      .datetime()
      .describe("Date ISO 8601 de dernière modification."),
  })
  .describe("Commentaire.");
export type CommentaireApiModel = z.infer<typeof commentaireApiModelSchema>;

// Body de création : `type` est contraint par le sujet (cf. factory ci-dessous).
const creerCommentaireBodySchema = <T extends z.ZodTypeAny>(typeSchema: T) =>
  z.object({
    type: typeSchema.describe("Catégorie du commentaire."),
    contenu: z
      .string()
      .describe("Contenu HTML riche (la chaîne vide est autorisée)."),
    statut: commentaireStatutSchema,
  });

export const creerIndicateurIndividuCommentaireBodySchema =
  creerCommentaireBodySchema(indicateurIndividuCommentaireTypeSchema);
export const creerPanierIndividuCommentaireBodySchema =
  creerCommentaireBodySchema(panierIndividuCommentaireTypeSchema);
export const creerPanierCommentaireBodySchema = creerCommentaireBodySchema(
  panierCommentaireTypeSchema,
);
// Type « élargi » consommé par la couche générique : le `type` est déjà validé
// par le schéma propre au sujet (route), donc ici on accepte n'importe quelle valeur.
export type CreerCommentaireBody = {
  type: string;
  contenu: string;
  statut: CommentaireStatut;
};

// Body de modification (socle, par id) : type non modifiable, individu/sujet figés.
export const modifierCommentaireBodySchema = z
  .object({
    contenu: z
      .string()
      .optional()
      .describe("Nouveau contenu HTML (optionnel)."),
    statut: commentaireStatutSchema
      .optional()
      .describe("Nouveau statut (optionnel)."),
  })
  .describe("Modification du contenu et/ou du statut d’un commentaire.");
export type ModifierCommentaireBody = z.infer<
  typeof modifierCommentaireBodySchema
>;

// Query de listing : `type` obligatoire, contraint par le sujet (cf. factory ci-dessous).
const listerCommentairesQuerySchema = <T extends z.ZodTypeAny>(typeSchema: T) =>
  z.object({
    type: typeSchema.describe("Catégorie du commentaire."),
    cursor: paginationCursorSchema.optional(),
    pageSize: pageSizeSchema,
  });

export const listerIndicateurIndividuCommentairesQuerySchema =
  listerCommentairesQuerySchema(indicateurIndividuCommentaireTypeSchema);
export const listerPanierIndividuCommentairesQuerySchema =
  listerCommentairesQuerySchema(panierIndividuCommentaireTypeSchema);
export const listerPanierCommentairesQuerySchema = listerCommentairesQuerySchema(
  panierCommentaireTypeSchema,
);
// Type « élargi » consommé par la couche générique : le `type` est déjà validé
// par le schéma propre au sujet (route).
export type ListerCommentairesQuery = {
  type: string;
  cursor?: string | undefined;
  pageSize?: number | undefined;
};

export const commentaireListApiModelSchema = createPaginatedApiListSchema(
  commentaireApiModelSchema,
);
export type CommentaireListApiModel = z.infer<
  typeof commentaireListApiModelSchema
>;

// --- Niveau de confiance -----------------------------------------------------

export const indiceConfianceSchema = z
  .enum(["OBJECTIF_COMPROMIS", "APPUIS_NECESSAIRE", "OBJECTIF_ATTEIGNABLE", "OBJECTIF_SECURISE"])
  .describe("Indice de confiance (état d’avancement vis-à-vis des objectifs).");
export type IndiceConfiance = z.infer<typeof indiceConfianceSchema>;

// Un niveau de confiance = un commentaire de type CONFIANCE + son indice courant.
export const niveauConfianceApiModelSchema = commentaireApiModelSchema
  .extend({ indice: indiceConfianceSchema })
  .describe("Niveau de confiance (commentaire CONFIANCE + indice courant).");
export type NiveauConfianceApiModel = z.infer<typeof niveauConfianceApiModelSchema>;

export const creerNiveauConfianceBodySchema = z.object({
  indice: indiceConfianceSchema,
  contenu: z.string().describe("Justification HTML riche (la chaîne vide est autorisée)."),
  statut: commentaireStatutSchema,
});
export type CreerNiveauConfianceBody = z.infer<typeof creerNiveauConfianceBodySchema>;

export const modifierNiveauConfianceBodySchema = z
  .object({
    indice: indiceConfianceSchema.optional().describe("Nouvel indice (append un NiveauConfiance)."),
    contenu: z.string().optional(),
    statut: commentaireStatutSchema.optional(),
  })
  .describe("Modification d’un niveau de confiance (indice / contenu / statut).");
export type ModifierNiveauConfianceBody = z.infer<typeof modifierNiveauConfianceBodySchema>;

export const niveauConfianceListApiModelSchema = createPaginatedApiListSchema(
  niveauConfianceApiModelSchema,
);
export type NiveauConfianceListApiModel = z.infer<typeof niveauConfianceListApiModelSchema>;
