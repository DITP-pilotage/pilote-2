import { z } from 'zod';
import { profilsCodes } from '@/server/domain/utilisateur/Utilisateur.interface';

export const validationProfilContexte = z.object({
  profilCode: z.enum(profilsCodes),
});
