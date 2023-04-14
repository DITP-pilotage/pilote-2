import { z } from 'zod';

export const validationChantierDonnéesTerritorialesRépartitionGéographique = z.object({
  chantierId: z.string(),
});
