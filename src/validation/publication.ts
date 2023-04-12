import { z } from 'zod';
import { typeCommentaire } from '@/server/domain/commentaire/Commentaire.interface';
import { mailles } from '@/server/domain/maille/Maille.interface';
import { typesObjectif } from '@/server/domain/objectif/Objectif.interface';

export const LIMITE_CARACTÈRES_PUBLICATION = 5000;

export const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const validationPublicationContexte = z.object({
  chantierId: z.string(),
  maille: z.enum(mailles),
  codeInsee: z.string(),
});

export const zodValidateurEntitéType = z.discriminatedUnion('entité', [
  z.object({
    entité: z.literal('commentaires'),
    type: z.enum(typeCommentaire), 
  }),
  z.object({
    entité: z.literal('objectifs'),
    type: z.enum(typesObjectif), 
  }),
]);

export const zodValidateurEntité = z.object({
  entité: z.enum(['commentaires', 'objectifs']),
});

export const validationPublicationFormulaire = zodValidateurEntitéType.and(
  z.object({
    contenu: z
      .string()
      .max(LIMITE_CARACTÈRES_PUBLICATION, `La limite maximale de ${LIMITE_CARACTÈRES_PUBLICATION} caractères a été dépassée`)
      .min(1, 'Ce champ ne peut pas être vide'),
  }),
);
