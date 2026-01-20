import { z } from "zod";

export const validationModifierMonProfil = z.object({
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  fonction: z.string().max(100).nullable(),
});
