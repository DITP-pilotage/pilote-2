export enum StatutProposition {
  EN_COURS = 'EN_COURS',
  RETIREE = 'RETIREE',
  ACCEPTEE_VIA_IMPORT = 'ACCEPTEE_VIA_IMPORT',
  TRAITEE_VIA_IMPORT = 'TRAITEE_VIA_IMPORT',
  IGNOREE_VIA_IMPORT = 'IGNOREE_VIA_IMPORT',
  ANNULEE = 'ANNULEE',
}

export type StatutPropositionType = keyof typeof StatutProposition;
