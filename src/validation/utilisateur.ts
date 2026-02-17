import { z } from "zod";
import { $Enums } from "@prisma/client";
import {
  ProfilCode,
  profilsCodes,
} from "@/server/domain/utilisateur/Utilisateur.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

const customErrorMail =
  "Vous essayez de créer un compte pour une adresse dont le domaine n'est pas en .gouv.fr. Veuillez contacter pilote.ditp@modernisation.gouv.fr pour plus d'informations.";

const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (
    issue.code === z.ZodIssueCode.invalid_string &&
    issue.validation === "email"
  ) {
    return { message: "L'adresse électronique saisie n'est pas valide" };
  }
  if (issue.code === z.ZodIssueCode.too_small) {
    return issue.minimum > 1
      ? {
          message: `Le champ est requis (${issue.minimum} caractère(s) minimum)`,
        }
      : { message: "Le champ est requis" };
  }
  if (issue.code === z.ZodIssueCode.too_big) {
    return {
      message: `La longueur maximale du champ est dépassée (${issue.maximum} caractères maximum)`,
    };
  }

  if (issue.code === z.ZodIssueCode.invalid_enum_value) {
    return { message: "Veuillez choisir une option" };
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(customErrorMap);

export const validationInfosBaseUtilisateur = z.object({
  email: z.string().email().min(1).max(100),
  nom: z.string().min(1).max(100),
  prénom: z.string().min(1).max(100),
  fonction: z.string().max(100).nullable(),
  service: z.string().nullable(),
  serviceAutre: z.string().max(200).transform((value) => value || null).nullable(),
  perimetreMinisteriel: z.string().nullable().transform((value) => value || null),
  profil: z.enum(profilsCodes),
  saisieIndicateur: z.boolean(),
  gestionUtilisateur: z.boolean(),
  applicationsAccessibles: z.array(z.nativeEnum($Enums.application_accessible)),
}).superRefine((data, ctx) => {
  if (data.service === "autre" && !data.serviceAutre) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Ce champ est obligatoire",
      path: ["serviceAutre"],
    });
  }

  if (data.service && data.service !== "autre" && !data.perimetreMinisteriel) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Ce champ est obligatoire",
      path: ["perimetreMinisteriel"],
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

export const validationInfosBaseUtilisateurSecretariatGeneral = z.object({
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
  fonction: z.string().max(100).nullable(),
  service: z.string().nullable(),
  serviceAutre: z.string().max(200).transform((value) => value || null).nullable(),
  perimetreMinisteriel: z.string().nullable().transform((value) => value || null),
  profil: z.enum(profilsCodes),
  saisieIndicateur: z.boolean(),
  applicationsAccessibles: z.array(z.nativeEnum($Enums.application_accessible)),
}).superRefine((data, ctx) => {
  if (data.service === "autre" && !data.serviceAutre) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Ce champ est obligatoire",
      path: ["serviceAutre"],
    });
  }

  if (data.service && data.service !== "autre" && !data.perimetreMinisteriel) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Ce champ est obligatoire",
      path: ["perimetreMinisteriel"],
    });
  }
});

const DOMAINES_AUTORISES_COORDINATEUR_BASE = [
  ".gouv.fr",
  ".caf.fr",
  ".cnafmail.fr",
];

const domainesAutorisesCoordinateur = (
  creationCompteArsActive: boolean,
): string[] => [
  ...DOMAINES_AUTORISES_COORDINATEUR_BASE,
  ...(creationCompteArsActive ? ["ars.sante.fr"] : []),
];

const adresseEstValideCoordinateur = (
  adresse: string,
  creationCompteArsActive: boolean,
): boolean =>
  domainesAutorisesCoordinateur(creationCompteArsActive).some((domaine) =>
    adresse.endsWith(domaine),
  );

export const validationInfosBaseUtilisateurCoordinateur = (
  creationCompteArsActive: boolean,
) =>
  z.object({
    email: z
      .string()
      .email()
      .min(1)
      .max(100)
      .refine(
        (value) => adresseEstValideCoordinateur(value, creationCompteArsActive),
        {
          message: customErrorMail,
        },
      ),
    nom: z.string().min(1).max(100),
    prénom: z.string().min(1).max(100),
    fonction: z.string().max(100).nullable(),
    service: z.string().nullable(),
    serviceAutre: z.string().max(200).transform((value) => value || null).nullable(),
    perimetreMinisteriel: z.string().nullable().transform((value) => value || null),
    profil: z.enum(profilsCodes),
    saisieIndicateur: z.boolean(),
    applicationsAccessibles: z.array(
      z.nativeEnum($Enums.application_accessible),
    ),
  }).superRefine((data, ctx) => {
    if (data.service === "autre" && !data.serviceAutre) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ce champ est obligatoire",
        path: ["serviceAutre"],
      });
    }

    if (data.service && data.service !== "autre" && !data.perimetreMinisteriel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ce champ est obligatoire",
        path: ["perimetreMinisteriel"],
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
  creationCompteArsActive: boolean = false,
) => {
  return [ProfilEnum.DITP_ADMIN, ProfilEnum.DITP_PILOTAGE].includes(profil)
    ? validationInfosBaseUtilisateur
    : profil === ProfilEnum.SECRETARIAT_GENERAL
      ? validationInfosBaseUtilisateurSecretariatGeneral
      : validationInfosBaseUtilisateurCoordinateur(creationCompteArsActive);
};
