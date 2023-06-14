import { z } from 'zod';
import { profils } from '@/server/domain/utilisateur/Utilisateur.interface';

const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_string && issue.validation === 'email') {
    return { message: "L'adresse électronique saisie n'est pas valide" };
  }
  if (issue.code === z.ZodIssueCode.too_small ) {
    return { message: `Le champ est requis (${issue.minimum} caractère(s) minimum)` };
  }
  if (issue.code === z.ZodIssueCode.invalid_enum_value ) {
    return { message: 'Veuillez choisir une option' };
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(customErrorMap);
export const validationInfosBaseUtilisateur = z.object({
  email: z.string().email(),
  nom: z.string().min(1 ),
  prénom: z.string().min(1 ),
  fonction: z.string(),
  profil: z.enum(profils),
});

