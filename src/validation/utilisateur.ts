import { z } from 'zod';
import { ProfilCode, profilsCodes } from '@/server/domain/utilisateur/Utilisateur.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

const customErrorMail = 'Vous essayez de créer un compte pour une adresse dont le domaine n’est pas en .gouv.fr. Veuillez contacter support.ditp@modernisation.gouv.fr pour plus d’informations.';

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
  saisieIndicateur: z.boolean(),
  saisieCommentaire: z.boolean(),
  gestionUtilisateur: z.boolean(),
});

export const validationInfosBaseUtilisateurCoordinateurs = z.object( {
  email: z.string().email().min(1).max(100).refine((value) => value.endsWith('.gouv.fr'), { message : customErrorMail }),
  nom: z.string().min(1).max(100),
  prénom: z.string().min(1).max(100),
  fonction: z.string().max(100).nullable(),
  profil: z.enum(profilsCodes),
  saisieIndicateur: z.boolean(),
  saisieCommentaire: z.boolean(),
});

export const validationInfosHabilitationsUtilisateur = z.object({
  habilitations : z.object({
    lecture: z.object({
      chantiers: z.string().array(),
      territoires: z.string().array(),
      périmètres: z.string().array(),
    }),
    responsabilite: z.object({
      chantiers: z.string().array(),
    }),
  }),
});

export const validationFiltresPourListeUtilisateur = z.object({
  filtres: z.object({
    chantiers: z.string().array(),
    territoires: z.string().array(),
    périmètresMinistériels: z.string().array(),
    chantiersAssociésAuxPérimètres: z.string().array(),
    profils: z.enum(profilsCodes).array(),
  }),
});

export const validationFiltresPourListeUtilisateurNew = z.object({
  filtres: z.object({
    chantiers: z.string().array(),
    territoires: z.string().array(),
    périmètresMinistériels: z.string().array(),
    chantiersAssociésAuxPérimètres: z.string().array(),
    profils: z.enum(profilsCodes).array(),
  }),
  pagination: z.object({
    pageIndex: z.number(),
    pageSize: z.number(),
  }),
  sorting: z.object({
    id: z.string().regex(/email|nom|prénom|profil|fonction|Dernière modification/),
    desc: z.boolean(),
  }).array(),
  valeurDeLaRecherche: z.string(),
});

export const validationSupprimerUtilisateur = z.object({
  email: z.string().email(),
});

export const codesTerritoiresDROM = ['NAT-FR', 'REG-01', 'REG-02', 'REG-03', 'REG-04', 'REG-06', 'DEPT-971', 'DEPT-972', 'DEPT-973', 'DEPT-974', 'DEPT-976'];

export const donneValidationInfosBaseUtilisateur = (profil: ProfilCode) => {
  return [ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE].includes(profil) ? validationInfosBaseUtilisateur : validationInfosBaseUtilisateurCoordinateurs;
};
