import { z } from 'zod';
import { typesObjectif } from '@/server/domain/objectif/Objectif.interface';

export const LIMITE_CARACTÈRES_OBJECTIF = 5000;

export const validationObjectifContexte = z.object({
  chantierId: z.string(),
});

export const validationObjectifHistorique = z.object({
  type: z.enum(typesObjectif),
});

export const validationObjectifFormulaire = z.object({
  contenu: z
    .string()
    .max(LIMITE_CARACTÈRES_OBJECTIF, `La limite maximale de ${LIMITE_CARACTÈRES_OBJECTIF} caractères a été dépassée.`)
    .min(1, 'L\'objectif ne peut pas être vide.'),
  type: z.enum(typesObjectif),
});
