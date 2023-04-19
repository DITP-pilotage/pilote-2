import { z } from 'zod';

export const validationChantierContexte = z.object({
  chantierId: z.string(),
});
