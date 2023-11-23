import { z } from 'zod';
import {
  presenterEnMapInformationMetadataIndicateurContrat,
} from '@/server/app/contrats/InformationMetadataIndicateurContrat';
import {
  YamlInformationMetadataIndicateurRepository,
} from '@/server/parametrage-indicateur/infrastructure/adapters/YamlInformationMetadataIndicateurRepository';

export const validationFiltresPourListeMetadataIndicateur = z.object({
  filtres: z.object({
    chantiers: z.string().array(),
  }),
});

const metadata = presenterEnMapInformationMetadataIndicateurContrat(new YamlInformationMetadataIndicateurRepository().récupererInformationMetadataIndicateur());

export const validationMetadataIndicateurFormulaire = z.object({
  indicParentIndic: z
    .string()
    .nullable(),
  indicParentCh: z
    .string()
    .refine((value) => /^CH-\d{3}$/.test(value), 'Veuillez sélectionner un chantier.'),
  indicNom: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(1, 'Ce champ ne peut pas être vide'),
  indicNomBaro: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  indicDescr: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(1, 'Ce champ ne peut pas être vide'),
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
    .min(1, 'Ce champ ne peut pas être vide'),
  indicHiddenPilote: z
    .string(),
  indicSchema: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  zgApplicable: z
    .string()
    .nullable()
    .refine((value) => value === null || value === '' || new RegExp(metadata.zg_applicable.metaPiloteEditRegex).test(value), metadata.zg_applicable.metaPiloteEditRegexViolationMessage),
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
    .refine((value) => new RegExp(metadata.param_vaca_decumul_from.metaPiloteEditRegex).test(value), metadata.param_vaca_decumul_from.metaPiloteEditRegexViolationMessage),
  paramVacaPartitionDate: z
    .string()
    .refine((value) => new RegExp(metadata.param_vaca_partition_date.metaPiloteEditRegex).test(value), metadata.param_vaca_partition_date.metaPiloteEditRegexViolationMessage),
  paramVacaOp: z
    .string(),
  paramVacgDecumulFrom: z
    .string()
    .refine((value) => new RegExp(metadata.param_vacg_decumul_from.metaPiloteEditRegex).test(value), metadata.param_vacg_decumul_from.metaPiloteEditRegexViolationMessage),
  paramVacgPartitionDate: z
    .string()
    .refine((value) => new RegExp(metadata.param_vacg_partition_date.metaPiloteEditRegex).test(value), metadata.param_vacg_partition_date.metaPiloteEditRegexViolationMessage),
  paramVacgOp: z
    .string(),
  poidsPourcentDept: z
    .string()
    .refine((value) => /^\d+$/.test(value), 'Veuillez saisir un nombre.'),
  poidsPourcentReg: z
    .string()
    .refine((value) => /^\d+$/.test(value), 'Veuillez saisir un nombre.'),
  poidsPourcentNat: z
    .string()
    .refine((value) => /^\d+$/.test(value), 'Veuillez saisir un nombre.'),
  tendance: z
    .string(),
});

export const validationMetadataIndicateurContexte = z.object({
  indicId: z.string(),
});
