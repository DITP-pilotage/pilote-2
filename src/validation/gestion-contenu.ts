import { z } from 'zod';

export const validationContenu =
  z.object({
    isBandeauActif: z.boolean(),
    bandeauTexte: z.string(),
    bandeauType: z.string(),
  });
