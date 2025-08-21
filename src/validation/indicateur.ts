import { z } from "zod";

export const validationDétailsIndicateur = z.object({
  indicateurId: z.string(),
  jalon: z.number(),
});

export const validationHistoriqueIndicateurTerritoire = z.object({
  indicateurId: z.string(),
  territoireCode: z.string(),
});
