import { z } from "zod";

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

export const auteurApiModelSchema = z
  .discriminatedUnion("type", [
    auteurUtilisateurApiModelSchema,
    auteurApiKeyApiModelSchema,
  ])
  .describe("Auteur (utilisateur ou clé API).");
export type AuteurApiModel = z.infer<typeof auteurApiModelSchema>;
