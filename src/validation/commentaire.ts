import { z } from 'zod';
import { mailles } from '@/server/domain/maille/Maille.interface';
import { typeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';

export const LIMITE_CARACTÈRES_COMMENTAIRE = 5000;

export const validationCommentaireContexte = z.object({
  chantierId: z.string(),
  maille: z.enum(mailles),
  codeInsee: z.string(),
});

export const validationCommentaireFormulaire = z.object({
  contenu: z
    .string()
    .max(LIMITE_CARACTÈRES_COMMENTAIRE, `La limite maximale de ${LIMITE_CARACTÈRES_COMMENTAIRE} caractères a été dépassée`)
    .min(1, 'Le commentaire ne peut pas être vide'),
  type: z.enum(typeCommentaire),
});
