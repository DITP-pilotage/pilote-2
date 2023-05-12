import { z } from 'zod';
import { typesCommentaireMailleNationale, typesCommentaireMailleRégionaleOuDépartementale } from '@/server/domain/commentaire/Commentaire.interface';
import { mailles } from '@/server/domain/maille/Maille.interface';
import { typesObjectif } from '@/server/domain/objectif/Objectif.interface';
import { codeInseeFrance, codesInseeDépartements, codesInseeRégions } from '@/server/domain/territoire/Territoire.interface';
import { typesDécisionStratégique } from '@/server/domain/décisionStratégique/DécisionStratégique.interface';

export const LIMITE_CARACTÈRES_PUBLICATION = 5000;

export const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const validationPublicationContexte = z.object({
  chantierId: z.string(),
  maille: z.enum(mailles),
  codeInsee: z.string(),
});

export const zodValidateurEntitéType = z.union([
  z.object({
    entité: z.literal('commentaires'),
    type: z.enum(typesCommentaireMailleNationale), 
    maille: z.literal('nationale'),
    codeInsee: z.literal(codeInseeFrance),
    chantierId: z.string(),
  }),
  z.object({
    entité: z.literal('commentaires'),
    type: z.enum(typesCommentaireMailleRégionaleOuDépartementale), 
    maille: z.enum(['régionale', 'départementale']),
    codeInsee: z.enum([...codesInseeDépartements, ...codesInseeRégions]),
    chantierId: z.string(),
  }),
  z.object({
    entité: z.literal('objectifs'),
    type: z.enum(typesObjectif), 
    maille: z.enum(mailles),
    codeInsee: z.string(),
    chantierId: z.string(),
  }),
  z.object({
    entité: z.literal('décisions stratégiques'),
    type: z.enum(typesDécisionStratégique),
    maille: z.enum(mailles),
    codeInsee: z.string(),
    chantierId: z.string(),
  }),
]);

export const zodValidateurEntité = z.object({
  entité: z.enum(['commentaires', 'objectifs', 'décisions stratégiques']),
});

export const validationPublicationFormulaire = zodValidateurEntitéType.and(
  z.object({
    contenu: z
      .string()
      .max(LIMITE_CARACTÈRES_PUBLICATION, `La limite maximale de ${LIMITE_CARACTÈRES_PUBLICATION} caractères a été dépassée`)
      .min(1, 'Ce champ ne peut pas être vide'),
  }),
);
