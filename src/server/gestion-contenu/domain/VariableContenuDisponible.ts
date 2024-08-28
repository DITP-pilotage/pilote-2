export interface VARIABLE_CONTENU_DISPONIBLE {
  'NEXT_BD_FF_BANDEAU_INDISPONIBILITE': boolean
  'NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TEXTE': string
  'NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TYPE': string
}

export const VARIABLE_CONTENU_DISPONIBLE_ENV = [
  'NEXT_PUBLIC_FF_NOUVELLE_PAGE_ACCUEIL',
  'NEXT_PUBLIC_FF_RAPPORT_DETAILLE',
  'NEXT_PUBLIC_FF_PROJETS_STRUCTURANTS',
  'NEXT_PUBLIC_FF_INFOBULLE_PONDERATION',
  'NEXT_PUBLIC_FF_DATE_METEO',
  'NEXT_PUBLIC_LIMITE_CARACTERES_PUBLICATION',
  'NEXT_PUBLIC_FF_ALERTES',
  'NEXT_PUBLIC_FF_ALERTES_BAISSE',
  'NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE',
  'NEXT_PUBLIC_FF_FICHE_TERRITORIALE',
  'NEXT_PUBLIC_FF_FICHE_CONDUCTEUR',
  'NEXT_PUBLIC_FF_GESTION_TOKEN_API',
  'NEXT_PUBLIC_FF_TA_ANNUEL',
  'NEXT_PUBLIC_FF_SUIVI_COMPLETUDE',
  'NEXT_PUBLIC_FF_ALERTE_MAJ_INDICATEUR',
  'NEXT_PUBLIC_FF_PROPOSITION_VALEUR_ACTUELLE',
  'NEXT_PUBLIC_SCHEMA_VALIDATA_URL',
  'NEXT_PUBLIC_FF_SOUS_INDICATEURS',
] as const;

export type VariableContenuDisponibleEnv = {
  NEXT_PUBLIC_FF_NOUVELLE_PAGE_ACCUEIL: boolean
  NEXT_PUBLIC_FF_RAPPORT_DETAILLE: boolean
  NEXT_PUBLIC_FF_PROJETS_STRUCTURANTS: boolean
  NEXT_PUBLIC_FF_INFOBULLE_PONDERATION: boolean
  NEXT_PUBLIC_FF_DATE_METEO: boolean
  NEXT_PUBLIC_LIMITE_CARACTERES_PUBLICATION: number
  NEXT_PUBLIC_FF_ALERTES: boolean
  NEXT_PUBLIC_FF_ALERTES_BAISSE: boolean
  NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE: boolean
  NEXT_PUBLIC_FF_FICHE_TERRITORIALE: boolean
  NEXT_PUBLIC_FF_FICHE_CONDUCTEUR: boolean
  NEXT_PUBLIC_FF_GESTION_TOKEN_API: boolean
  NEXT_PUBLIC_FF_TA_ANNUEL: boolean
  NEXT_PUBLIC_FF_SUIVI_COMPLETUDE: boolean
  NEXT_PUBLIC_FF_ALERTE_MAJ_INDICATEUR: boolean
  NEXT_PUBLIC_FF_PROPOSITION_VALEUR_ACTUELLE: boolean
  NEXT_PUBLIC_SCHEMA_VALIDATA_URL: string
  NEXT_PUBLIC_FF_SOUS_INDICATEURS: boolean
};
