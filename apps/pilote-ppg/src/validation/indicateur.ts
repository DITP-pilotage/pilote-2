import { z } from "zod";

export const validationHistoriqueIndicateurTerritoire = z.object({
  indicateurId: z.string(),
  territoireCode: z.string(),
});
