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
    perimetresMinisteriels: z.string().array(),
    estTerritorialise: z.boolean(),
    estBarometre: z.boolean(),
  }),
});

const metadata = presenterEnMapInformationMetadataIndicateurContrat(new YamlInformationMetadataIndicateurRepository().récupererInformationMetadataIndicateur());

const validationMetadataIndicateurContexte = z.object({
  indicId: z.string()
    .refine((value) => new RegExp(metadata.indic_id.metaPiloteEditRegex).test(value), value => ({ message: `valeur: '${value}'. message: ${metadata.indic_id.metaPiloteEditRegexViolationMessage}` })),
});

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
    .max(2500, 'La limite maximale de 2500 caractères a été dépassée')
    .min(1, 'Ce champ ne peut pas être vide'),
  indicDescrBaro: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  indicIsPerseverant: z
    .boolean(),
  indicIsPhare: z
    .boolean(),
  indicIsBaro: z
    .boolean(),
  indicType: z
    .string()
    .min(1, 'Veuillez choisir une option valide pour la typologie'),
  indicSource: z
    .string()
    .max(2500, 'La limite maximale de 2500 caractères a été dépassée')
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
    .nullable(),
  indicHiddenPilote: z
    .string(),
  indicSchema: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  zgApplicable: z
    .string()
    .nullable(),
  viDeptFrom: z
    .string(),
  viDeptOp: z
    .string()
    .optional(),
  vaDeptFrom: z
    .string(),
  vaDeptOp: z
    .string()
    .optional(),
  vcDeptFrom: z
    .string(),
  vcDeptOp: z
    .string()
    .optional(),
  viRegFrom: z
    .string(),
  viRegOp: z
    .string()
    .optional(),
  vaRegFrom: z
    .string(),
  vaRegOp: z
    .string()
    .optional(),
  vcRegFrom: z
    .string(),
  vcRegOp: z
    .string()
    .optional(),
  viNatFrom: z
    .string(),
  viNatOp: z
    .string()
    .optional(),
  vaNatFrom: z
    .string(),
  vaNatOp: z
    .string()
    .optional(),
  vcNatFrom: z
    .string(),
  vcNatOp: z
    .string()
    .optional(),
  paramVacaDecumulFrom: z
    .string()
    .refine((value) => new RegExp(metadata.param_vaca_decumul_from.metaPiloteEditRegex).test(value), metadata.param_vaca_decumul_from.metaPiloteEditRegexViolationMessage),
  paramVacaPartitionDate: z
    .string()
    .refine((value) => new RegExp(metadata.param_vaca_partition_date.metaPiloteEditRegex).test(value), metadata.param_vaca_partition_date.metaPiloteEditRegexViolationMessage),
  paramVacaOp: z
    .string()
    .min(1, "Veuillez choisir une option valide pour l'Opération (TA annuel)"),
  paramVacgDecumulFrom: z
    .string()
    .refine((value) => new RegExp(metadata.param_vacg_decumul_from.metaPiloteEditRegex).test(value), metadata.param_vacg_decumul_from.metaPiloteEditRegexViolationMessage),
  paramVacgPartitionDate: z
    .string()
    .refine((value) => new RegExp(metadata.param_vacg_partition_date.metaPiloteEditRegex).test(value), metadata.param_vacg_partition_date.metaPiloteEditRegexViolationMessage),
  paramVacgOp: z
    .string()
    .min(1, "Veuillez choisir une option valide pour l'Opération (TA global)"),
  poidsPourcentDept: z
    .string()
    .refine((value) => new RegExp(metadata.poids_pourcent_dept_declaree.metaPiloteEditRegex).test(value), metadata.poids_pourcent_dept_declaree.metaPiloteEditRegexViolationMessage),
  poidsPourcentReg: z
    .string()
    .refine((value) => new RegExp(metadata.poids_pourcent_reg_declaree.metaPiloteEditRegex).test(value), metadata.poids_pourcent_reg_declaree.metaPiloteEditRegexViolationMessage),
  poidsPourcentNat: z
    .string()
    .refine((value) => new RegExp(metadata.poids_pourcent_nat_declaree.metaPiloteEditRegex).test(value), metadata.poids_pourcent_nat_declaree.metaPiloteEditRegexViolationMessage),
  tendance: z
    .string(),
  reformePrioritaire: z
    .string()
    .nullable(),
  projetAnnuelPerf: z
    .boolean(),
  detailProjetAnnuelPerf: z
    .string()
    .nullable(),
  periodicite: z
    .string()
    .min(1, 'Veuillez choisir une option valide pour la periodicité'),
  delaiDisponibilite: z
    .string()
    .refine((value) => new RegExp(metadata.delai_disponibilite.metaPiloteEditRegex).test(value), metadata.delai_disponibilite.metaPiloteEditRegexViolationMessage),
  indicTerritorialise: z
    .boolean(),
  frequenceTerritoriale: z
    .string()
    .refine((value) => new RegExp(metadata.frequence_territoriale.metaPiloteEditRegex).test(value), metadata.frequence_territoriale.metaPiloteEditRegexViolationMessage),
  mailles: z
    .string()
    .nullable(),
  adminSource: z
    .string(),
  methodeCollecte: z
    .string()
    .nullable(),
  siSource: z
    .string()
    .nullable(),
  donneeOuverte: z
    .boolean(),
  modalitesDonneeOuverte: z
    .string()
    .nullable(),
  respDonnees: z
    .string()
    .nullable(),
  respDonneesEmail: z
    .string()
    .nullable(),
  contactTechnique: z
    .string()
    .nullable(),
  contactTechniqueEmail: z
    .string()
    .nullable(),
  commentaire: z
    .string()
    .nullable(),
  maillePilotage: z
    .string()
    .min(1, 'Veuillez choisir une option valide pour la maille de pilotage'),
  cibleAttendue: z
    .boolean(),
  couvertureTemporelle: z
    .string()
    .min(1, 'Veuillez choisir une option valide pour la couverture temporelle'),
}).and(validationMetadataIndicateurContexte)
  .superRefine((data, ctx) => {
    const validations = [
      { from: data.viDeptFrom, op: data.viDeptOp, field: 'viDeptOp' },
      { from: data.vaDeptFrom, op: data.vaDeptOp, field: 'vaDeptOp' },
      { from: data.vcDeptFrom, op: data.vcDeptOp, field: 'vcDeptOp' },
      { from: data.viRegFrom, op: data.viRegOp, field: 'viRegOp' },
      { from: data.vaRegFrom, op: data.vaRegOp, field: 'vaRegOp' },
      { from: data.vcRegFrom, op: data.vcRegOp, field: 'vcRegOp' },
      { from: data.viNatFrom, op: data.viNatOp, field: 'viNatOp' },
      { from: data.vaNatFrom, op: data.vaNatOp, field: 'vaNatOp' },
      { from: data.vcNatFrom, op: data.vcNatOp, field: 'vcNatOp' },
    ];

    validations.forEach(({ from, op, field }) => {
      if (from !== 'user_input' && from !== '_' && (op === undefined || op === '' || op === '_')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La méthode d'agrégation est requise",
          path: [field],
        });
      }
    });
  });

export const validationImportMetadataIndicateurFormulaire = z.object({
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
    .max(2500, 'La limite maximale de 2500 caractères a été dépassée')
    .min(1, 'Ce champ ne peut pas être vide'),
  indicDescrBaro: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  indicIsPerseverant: z
    .boolean(),
  indicIsPhare: z
    .boolean(),
  indicIsBaro: z
    .boolean(),
  indicType: z
    .string()
    .min(1, 'Veuillez choisir une option valide pour la typologie'),
  indicSource: z
    .string()
    .max(2500, 'La limite maximale de 2500 caractères a été dépassée')
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
    .nullable(),
  indicHiddenPilote: z
    .boolean(),
  indicSchema: z
    .string()
    .max(500, 'La limite maximale de 500 caractères a été dépassée')
    .min(0, 'Ce champ ne peut pas être vide')
    .nullable(),
  zgApplicable: z
    .string()
    .nullable(),
  viDeptFrom: z
    .string(),
  viDeptOp: z
    .string()
    .optional(),
  vaDeptFrom: z
    .string(),
  vaDeptOp: z
    .string()
    .optional(),
  vcDeptFrom: z
    .string(),
  vcDeptOp: z
    .string()
    .optional(),
  viRegFrom: z
    .string(),
  viRegOp: z
    .string()
    .optional(),
  vaRegFrom: z
    .string(),
  vaRegOp: z
    .string()
    .optional(),
  vcRegFrom: z
    .string(),
  vcRegOp: z
    .string()
    .optional(),
  viNatFrom: z
    .string(),
  viNatOp: z
    .string()
    .optional(),
  vaNatFrom: z
    .string(),
  vaNatOp: z
    .string()
    .optional(),
  vcNatFrom: z
    .string(),
  vcNatOp: z
    .string()
    .optional(),
  paramVacaDecumulFrom: z
    .string()
    .refine((value) => new RegExp(metadata.param_vaca_decumul_from.metaPiloteEditRegex).test(value), metadata.param_vaca_decumul_from.metaPiloteEditRegexViolationMessage),
  paramVacaPartitionDate: z
    .string()
    .refine((value) => new RegExp(metadata.param_vaca_partition_date.metaPiloteEditRegex).test(value), metadata.param_vaca_partition_date.metaPiloteEditRegexViolationMessage),
  paramVacaOp: z
    .string()
    .min(1, "Veuillez choisir une option valide pour l'Opération (TA annuel)"),
  paramVacgDecumulFrom: z
    .string()
    .refine((value) => new RegExp(metadata.param_vacg_decumul_from.metaPiloteEditRegex).test(value), metadata.param_vacg_decumul_from.metaPiloteEditRegexViolationMessage),
  paramVacgPartitionDate: z
    .string()
    .refine((value) => new RegExp(metadata.param_vacg_partition_date.metaPiloteEditRegex).test(value), metadata.param_vacg_partition_date.metaPiloteEditRegexViolationMessage),
  paramVacgOp: z
    .string()
    .min(1, "Veuillez choisir une option valide pour l'Opération (TA global)"),
  poidsPourcentDept: z
    .string()
    .refine((value) => new RegExp(metadata.poids_pourcent_dept_declaree.metaPiloteEditRegex).test(value), metadata.poids_pourcent_dept_declaree.metaPiloteEditRegexViolationMessage),
  poidsPourcentReg: z
    .string()
    .refine((value) => new RegExp(metadata.poids_pourcent_reg_declaree.metaPiloteEditRegex).test(value), metadata.poids_pourcent_reg_declaree.metaPiloteEditRegexViolationMessage),
  poidsPourcentNat: z
    .string()
    .refine((value) => new RegExp(metadata.poids_pourcent_nat_declaree.metaPiloteEditRegex).test(value), metadata.poids_pourcent_nat_declaree.metaPiloteEditRegexViolationMessage),
  tendance: z
    .string(),
  reformePrioritaire: z
    .string()
    .nullable(),
  projetAnnuelPerf: z
    .boolean(),
  detailProjetAnnuelPerf: z
    .string()
    .nullable(),
  periodicite: z
    .string()
    .min(1, 'Veuillez choisir une option valide pour la periodicité'),
  delaiDisponibilite: z
    .number({ invalid_type_error: metadata.delai_disponibilite.metaPiloteEditRegexViolationMessage }),
  indicTerritorialise: z
    .boolean(),
  frequenceTerritoriale: z
    .number({ invalid_type_error: metadata.frequence_territoriale.metaPiloteEditRegexViolationMessage }),
  mailles: z
    .string()
    .nullable(),
  adminSource: z
    .string(),
  methodeCollecte: z
    .string()
    .nullable(),
  siSource: z
    .string()
    .nullable(),
  donneeOuverte: z
    .boolean(),
  modalitesDonneeOuverte: z
    .string()
    .nullable(),
  respDonnees: z
    .string()
    .nullable(),
  respDonneesEmail: z
    .string()
    .nullable(),
  contactTechnique: z
    .string()
    .nullable(),
  contactTechniqueEmail: z
    .string()
    .nullable(),
  commentaire: z
    .string()
    .nullable(),
}).and(validationMetadataIndicateurContexte)
  .superRefine((data, ctx) => {
    const validations = [
      { from: data.viDeptFrom, op: data.viDeptOp, field: 'viDeptOp' },
      { from: data.vaDeptFrom, op: data.vaDeptOp, field: 'vaDeptOp' },
      { from: data.vcDeptFrom, op: data.vcDeptOp, field: 'vcDeptOp' },
      { from: data.viRegFrom, op: data.viRegOp, field: 'viRegOp' },
      { from: data.vaRegFrom, op: data.vaRegOp, field: 'vaRegOp' },
      { from: data.vcRegFrom, op: data.vcRegOp, field: 'vcRegOp' },
      { from: data.viNatFrom, op: data.viNatOp, field: 'viNatOp' },
      { from: data.vaNatFrom, op: data.vaNatOp, field: 'vaNatOp' },
      { from: data.vcNatFrom, op: data.vcNatOp, field: 'vcNatOp' },
    ];

    validations.forEach(({ from, op, field }) => {
      if (from !== 'user_input' && from !== '_' && (op === undefined || op === '' || op === '_')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La méthode d'agrégation est requise",
          path: [field],
        });
      }
    });
  });
