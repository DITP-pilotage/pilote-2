import { z } from 'zod';
import { typesCommentaireMailleNationale, typesCommentaireMailleRégionaleOuDépartementale } from '@/server/domain/chantier/commentaire/Commentaire.interface';
import { typesObjectif } from '@/server/domain/chantier/objectif/Objectif.interface';
import { typesDécisionStratégique } from '@/server/domain/chantier/décisionStratégique/DécisionStratégique.interface';
import { typeObjectifProjetStructurant } from '@/server/domain/projetStructurant/objectif/Objectif.interface';
import { typesCommentaireProjetStructurant } from '@/server/domain/projetStructurant/commentaire/Commentaire.interface';

export const LIMITE_CARACTÈRES_PUBLICATION = 5000;

export const zodValidateurCSRF = z.object({
  csrf: z.string(),
});

export const validationPublicationContexte = z.object({
  typeDeRéforme: z.string(),
  réformeId: z.string(),
  territoireCode: z.string(),
});

export const zodValidateurEntitéType = z.union([
  z.object({
    entité: z.literal('commentaires'),
    type: z.enum([...typesCommentaireMailleNationale, ...typesCommentaireMailleRégionaleOuDépartementale, ...typesCommentaireProjetStructurant]), 
  }),
  z.object({
    entité: z.literal('objectifs'),
    type: z.enum([...typesObjectif, typeObjectifProjetStructurant]), 
  }),
  z.object({
    entité: z.literal('décisions stratégiques'),
    type: z.enum(typesDécisionStratégique),
  }),
]);

export const zodValidateurEntité = z.object({
  entité: z.enum(['commentaires', 'objectifs', 'décisions stratégiques']),
});

export const validationPublicationFormulaire = validationPublicationContexte.and(zodValidateurEntitéType).and(
  z.object({
    contenu: z
      .string()
      .max(LIMITE_CARACTÈRES_PUBLICATION, `La limite maximale de ${LIMITE_CARACTÈRES_PUBLICATION} caractères a été dépassée`)
      .min(1, 'Ce champ ne peut pas être vide'),
  }),
);
