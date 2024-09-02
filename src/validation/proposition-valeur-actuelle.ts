import { z } from 'zod';

export const validationPropositionValeurActuelle =
  z.object({
    valeurActuelle: z.string()
      .refine((value) => new RegExp(/^\d+$|^\d+\\.\d+$/).test(value), 'Le champ doit être un nombre'),
    motifProposition: z.string()
      .refine((value) => new RegExp(/^\w.*$/).test(value), 'Veuillez saisir un motif de proposition'),
    sourceDonneeEtMethodeCalcul: z.string()
      .refine((value) => new RegExp(/^\w.*$/).test(value), 'Veuillez saisir une source de donnée ainsi que la méthode de calcul'),
    dateValeurActuelle: z.string(),
    indicId: z.string(),
    territoireCode: z.string(),
  });
