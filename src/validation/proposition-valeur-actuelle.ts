import { z } from 'zod';

export const validationPropositionValeurActuelle =
  z.object({
    valeurActuelle: z.number(),
  });
