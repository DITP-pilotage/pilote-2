import { z } from "zod";
import { $Enums } from "@prisma/client";
import {
  ProfilCode,
  profilsCodes,
} from "@/server/domain/utilisateur/Utilisateur.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

const customErrorMail =
  "Vous essayez de créer un compte pour une adresse dont le domaine n'est pas en .gouv.fr. Veuillez contacter pilote.ditp@modernisation.gouv.fr pour plus d'informations.";

// zod 4 : l'error map ne recoit plus de `ctx`, et rendre `undefined` retombe sur le
// message par defaut. Les codes ont change : `invalid_string` + `validation: "email"`
// est devenu `invalid_format` + `format: "email"`, et `invalid_enum_value` est devenu
// `invalid_value`. Cette map tient les messages FR de tous les formulaires : la laisser
// retomber en silence sur les defauts les repasserait en anglais.
const customErrorMap: z.core.$ZodErrorMap = (issue) => {
  if (issue.code === "invalid_format" && issue.format === "email") {
    return { message: "L'adresse électronique saisie n'est pas valide" };
  }
  if (issue.code === "too_small") {
    return Number(issue.minimum) > 1
      ? {
          message: `Le champ est requis (${issue.minimum} caractère(s) minimum)`,
        }
      : { message: "Le champ est requis" };
  }
  if (issue.code === "too_big") {
    return {
      message: `La longueur maximale du champ est dépassée (${issue.maximum} caractères maximum)`,
    };
  }

  if (issue.code === "invalid_value") {
    return { message: "Veuillez choisir une option" };
  }
  return undefined;
};

z.config({ customError: customErrorMap });

export const validationInfosBaseUtilisateur = z
  .object({
    email: z.string().email().min(1).max(100),
    nom: z.string().min(1).max(100),
    prénom: z.string().min(1).max(100),
    fonction: z.string().trim().min(1).max(100),
    service: z.string().trim().min(1),
    serviceAutre: z
      .string()
      .max(200)
      .transform((value) => value || null)
      .nullable(),
    perimetreMinisteriel: z
      .string()
      .nullable()
      .transform((value) => value || null),
    profil: z.enum(profilsCodes),
    saisieIndicateur: z.boolean(),
    gestionUtilisateur: z.boolean(),
    applicationsAccessibles: z.array(
      z.nativeEnum($Enums.application_accessible),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.service === "autre" && !data.serviceAutre) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ce champ est obligatoire",
        path: ["serviceAutre"],
      });
    }
  });

const adresseEstValideSecretariatGeneral = (adresse: string) => {
  return (
    adresse.endsWith(".gouv.fr") ||
    /^.+@ac-[\da-z\-]+\.fr$/i.test(adresse) ||
    /^.+@region-academique-[\da-z\-]+\.fr$/i.test(adresse)
  );
};

export const validationInfosBaseUtilisateurSecretariatGeneral = z
  .object({
    email: z
      .string()
      .email()
      .min(1)
      .max(100)
      .refine((value) => adresseEstValideSecretariatGeneral(value), {
        message: customErrorMail,
      }),
    nom: z.string().min(1).max(100),
    prénom: z.string().min(1).max(100),
    fonction: z.string().trim().min(1).max(100),
    service: z.string().trim().min(1),
    serviceAutre: z
      .string()
      .max(200)
      .transform((value) => value || null)
      .nullable(),
    perimetreMinisteriel: z
      .string()
      .nullable()
      .transform((value) => value || null),
    profil: z.enum(profilsCodes),
    saisieIndicateur: z.boolean(),
    applicationsAccessibles: z.array(
      z.nativeEnum($Enums.application_accessible),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.service === "autre" && !data.serviceAutre) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ce champ est obligatoire",
        path: ["serviceAutre"],
      });
    }
  });

const DOMAINES_AUTORISES_COORDINATEUR_BASE = [
  ".gouv.fr",
  ".caf.fr",
  ".cnafmail.fr",
];

const domainesAutorisesCoordinateur = (
  ffCreationCompteArs: boolean,
): string[] => [
  ...DOMAINES_AUTORISES_COORDINATEUR_BASE,
  ...(ffCreationCompteArs ? ["ars.sante.fr"] : []),
];

const adresseEstValideCoordinateur = (
  adresse: string,
  ffCreationCompteArs: boolean,
): boolean =>
  domainesAutorisesCoordinateur(ffCreationCompteArs).some((domaine) =>
    adresse.endsWith(domaine),
  );

export const validationInfosBaseUtilisateurCoordinateur = (
  ffCreationCompteArs: boolean,
) =>
  z
    .object({
      email: z
        .string()
        .email()
        .min(1)
        .max(100)
        .refine(
          (value) => adresseEstValideCoordinateur(value, ffCreationCompteArs),
          {
            message: customErrorMail,
          },
        ),
      nom: z.string().min(1).max(100),
      prénom: z.string().min(1).max(100),
      fonction: z.string().trim().min(1).max(100),
      service: z.string().trim().min(1),
      serviceAutre: z
        .string()
        .max(200)
        .transform((value) => value || null)
        .nullable(),
      perimetreMinisteriel: z
        .string()
        .nullable()
        .transform((value) => value || null),
      profil: z.enum(profilsCodes),
      saisieIndicateur: z.boolean(),
      applicationsAccessibles: z.array(
        z.nativeEnum($Enums.application_accessible),
      ),
    })
    .superRefine((data, ctx) => {
      if (data.service === "autre" && !data.serviceAutre) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ce champ est obligatoire",
          path: ["serviceAutre"],
        });
      }
    });

export const validationInfosHabilitationsUtilisateur = z.object({
  habilitations: z.object({
    lecture: z.object({
      chantiers: z.string().array(),
      territoires: z.string().array(),
      périmètres: z.string().array(),
    }),
    responsabilite: z.object({
      chantiers: z.string().array(),
    }),
    saisieCommentaire: z.object({
      chantiers: z.string().array(),
    }),
  }),
});

export const validationSupprimerUtilisateur = z.object({
  email: z.string().email(),
});

export const validationReactiverUtilisateur = z.object({
  email: z.string().email(),
});

export const validationDesactiverVideoAccueil = z.object({
  utilisateurId: z.string(),
});

export const validationEnvoyerMailInscriptionInfolettre = z.object({
  utilisateurEmail: z.string(),
  lienConfirmationInscription: z.string(),
});

export const codesTerritoiresDROM = [
  "NAT-FR",
  "REG-01",
  "REG-02",
  "REG-03",
  "REG-04",
  "REG-06",
  "DEPT-971",
  "DEPT-972",
  "DEPT-973",
  "DEPT-974",
  "DEPT-976",
];

export const donneValidationInfosBaseUtilisateur = (
  profil: ProfilCode,
  ffCreationCompteArs: boolean = false,
) => {
  return [ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE].includes(profil)
    ? validationInfosBaseUtilisateur
    : profil === ProfilEnum.SECRETARIAT_GENERAL
      ? validationInfosBaseUtilisateurSecretariatGeneral
      : validationInfosBaseUtilisateurCoordinateur(ffCreationCompteArs);
};
