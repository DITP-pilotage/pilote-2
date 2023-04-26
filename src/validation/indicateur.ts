import { z } from 'zod';
import { mailles } from '@/server/domain/maille/Maille.interface';

export const validationDétailsIndicateurs = z.object({
  chantierId: z.string(),
  maille: z.enum(mailles),
  codesInsee: z.string().array(),
});
