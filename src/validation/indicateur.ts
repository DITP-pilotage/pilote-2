import { z } from 'zod';

export const validationDétailsIndicateurs = z.object({
  chantierId: z.string(),
  territoireCodes: z.array(z.string()),
});

export const validationDétailsIndicateur = z.object({
  indicateurId: z.string(),
});
