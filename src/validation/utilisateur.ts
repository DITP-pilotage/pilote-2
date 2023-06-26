import { z } from 'zod';
import { profilsCodes } from '@/server/domain/utilisateur/Utilisateur.interface';

const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_string && issue.validation === 'email') {
    return { message: "L'adresse électronique saisie n'est pas valide" };
  }
  if (issue.code === z.ZodIssueCode.too_small ) {
    return issue.minimum > 1
      ? { message: `Le champ est requis (${issue.minimum} caractère(s) minimum)` }
      : { message: 'Le champ est requis' };
  }
  if (issue.code === z.ZodIssueCode.too_big ) {
    return { message: `La longueur maximale du champ est dépassée (${issue.maximum} caractères maximum)` };
  }

  if (issue.code === z.ZodIssueCode.invalid_enum_value ) {
    return { message: 'Veuillez choisir une option' };
  }
  return { message: ctx.defaultError };
};


z.setErrorMap(customErrorMap);

export const validationInfosBaseUtilisateur = z.object( {
  email: z.string().email().min(1).max(100),
  nom: z.string().min(1).max(100),
  prénom: z.string().min(1).max(100),
  fonction: z.string().max(100).nullable(),
  profil: z.enum(profilsCodes),
});

export const validationInfosHabilitationsUtilisateur = z.object({
  habilitations : z.object({
    lecture: z.object({
      chantiers: z.string().array(),
      territoires: z.string().array(),
      périmètres: z.string().array(),
    }),
    'saisie.indicateur': z.object({
      chantiers: z.string().array(),
      territoires: z.string().array(),
      périmètres: z.string().array(),
    }),
    'saisie.commentaire': z.object({
      chantiers: z.string().array(),
      territoires: z.string().array(),
      périmètres: z.string().array(),
    }),
  }),
});

export const codesTerritoiresDROM = ['NAT-FR', 'REG-01', 'REG-02', 'REG-03', 'REG-04', 'REG-06', 'DEPT-971', 'DEPT-972', 'DEPT-973', 'DEPT-974', 'DEPT-976'];
