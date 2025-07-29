import { z } from "zod";

export const validationDétailsIndicateur = z.object({
  indicateurId: z.string(),
  jalon: z.number(),
});
