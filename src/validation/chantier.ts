import { z } from 'zod';

export const validationChantierContexte = z.object({
  chantierId: z.string(),
});

export const validationChantiersContexte = z.object({
  chantiers: z.array(z.string()),
  maille: z.string(),
});
