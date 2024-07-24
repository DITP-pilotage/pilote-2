import { z } from 'zod';

export const validationPropositionValeurActuelle =
  z.object({
    valeurActuelle: z.string()
      .refine((value) => new RegExp('(^\\d+$)|(^\\d+\\.\\d+$)').test(value), 'Le champ doit être un nombre'),
    motifProposition: z.string(),
    sourceDonneeEtMethodeCalcul: z.string(),
    dateValeurActuelle: z.string(),
    indicId: z.string(),
    territoireCode: z.string(),
  });
