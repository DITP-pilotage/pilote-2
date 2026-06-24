import { z } from "zod";

import { commentaireApiModelSchema } from "./commentaire";
import {
  createPaginatedApiListSchema,
  pageSizeSchema,
  paginationCursorSchema,
} from "./pagination";

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
  .describe("Auteur d’un niveau de confiance (utilisateur ou clé API).");

export const indiceConfianceSchema = z
  .enum([
    "OBJECTIF_COMPROMIS",
    "APPUIS_NECESSAIRE",
    "OBJECTIF_ATTEIGNABLE",
    "OBJECTIF_SECURISE",
  ])
  .describe("Indice de confiance (état d’avancement vis-à-vis des objectifs).");
export type IndiceConfiance = z.infer<typeof indiceConfianceSchema>;

export const niveauConfianceApiModelSchema = z
  .object({
    id: z.string().uuid().describe("Identifiant du niveau de confiance."),
    indice: indiceConfianceSchema,
    commentaire: commentaireApiModelSchema.describe(
      "Commentaire CONFIANCE qui justifie l’indice.",
    ),
    auteurCreation: auteurApiModelSchema,
    auteurModification: auteurApiModelSchema,
    createdAt: z.string().datetime().describe("Date ISO 8601 de création."),
    updatedAt: z
      .string()
      .datetime()
      .describe("Date ISO 8601 de dernière modification."),
  })
  .describe("Niveau de confiance attaché à un commentaire CONFIANCE.");
export type NiveauConfianceApiModel = z.infer<
  typeof niveauConfianceApiModelSchema
>;

export const creerNiveauConfianceBodySchema = z
  .object({
    commentaireId: z
      .string()
      .uuid()
      .describe("Identifiant du commentaire CONFIANCE déjà créé."),
    indice: indiceConfianceSchema,
  })
  .describe("Création d’un niveau de confiance.");
export type CreerNiveauConfianceBody = z.infer<
  typeof creerNiveauConfianceBodySchema
>;

export const modifierNiveauConfianceBodySchema = z
  .object({
    indice: indiceConfianceSchema,
  })
  .describe("Modification d’un niveau de confiance (indice).");
export type ModifierNiveauConfianceBody = z.infer<
  typeof modifierNiveauConfianceBodySchema
>;

export const historiqueNiveauConfianceQuerySchema = z.object({
  cursor: paginationCursorSchema.optional(),
  pageSize: pageSizeSchema,
});
export type HistoriqueNiveauConfianceQuery = z.infer<
  typeof historiqueNiveauConfianceQuerySchema
>;

export const niveauConfianceListApiModelSchema = createPaginatedApiListSchema(
  niveauConfianceApiModelSchema,
);
export type NiveauConfianceListApiModel = z.infer<
  typeof niveauConfianceListApiModelSchema
>;
