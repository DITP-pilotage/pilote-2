import { z } from 'zod';

export const validationFiltresPourListeMetadataIndicateur = z.object({
  filtres: z.object({
    chantiers: z.string().array(),
  }),
});


export const validationMetadataIndicateurFormulaire = z.object({
  indicParentIndic: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  indicNom: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  indicNomBaro: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  indicDescr: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  indicDescrBaro: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  indicIsPerseverant: z
    .string(),
  indicIsPhare: z
    .string(),
  indicIsBaro: z
    .string(),
  indicType: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  indicSource: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  indicSourceUrl: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  indicMethodeCalcul: z
    .string()
    .max(5000, 'La limite maximale de 5000 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  indicUnite: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  indicHiddenPilote: z
    .string(),
  indicSchema: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  viDeptFrom: z
    .string(),
  viDeptOp: z
    .string(),
  vaDeptFrom: z
    .string(),
  vaDeptOp: z
    .string(),
  vcDeptFrom: z
    .string(),
  vcDeptOp: z
    .string(),
  viRegFrom: z
    .string(),
  viRegOp: z
    .string(),
  vaRegFrom: z
    .string(),
  vaRegOp: z
    .string(),
  vcRegFrom: z
    .string(),
  vcRegOp: z
    .string(),
  viNatFrom: z
    .string(),
  viNatOp: z
    .string(),
  vaNatFrom: z
    .string(),
  vaNatOp: z
    .string(),
  vcNatFrom: z
    .string(),
  vcNatOp: z
    .string(),
  paramVacaDecumulFrom: z
    .string()
    .refine((value) => /^from_year_start|from_custom_date::20\\d\\d-\\d\\d-\\d\\d$/.test(value), 'Veuillez saisir une date de début correcte.'),
  paramVacaPartitionDate: z
    .string()
    .refine((value) => /^_|from_year_start|from_custom_date::20\\d\\d-\\d\\d-\\d\\d|from_month::\\d\\d$/.test(value), 'Veuillez saisir une date de début correcte.'),
  paramVacaOp: z
    .string(),
  paramVacgDecumulFrom: z
    .string()
    .refine((value) => /^_|from_year_start|from_custom_date::20\\d\\d-\\d\\d-\\d\\d$/.test(value), 'Veuillez saisir une date de début correcte.'),
  paramVacgPartitionDate: z
    .string()
    .refine((value) => /^_|from_year_start|from_custom_date::20\\d\\d-\\d\\d-\\d\\d|from_month::\\d\\d$/.test(value), 'Veuillez saisir une date de début correcte.'),
  paramVacgOp: z
    .string(),
  poidsPourcentDept: z
    .number(),
  poidsPourcentReg: z
    .number(),
  poidsPourcentNat: z
    .number(),
  tendance: z
    .string(),
});

export const validationMetadataIndicateurContexte = z.object({
  indicId: z.string(),
});
