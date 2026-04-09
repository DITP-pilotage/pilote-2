import { configurationFeatureFlip } from "@/config";

export interface VARIABLE_CONTENU_DISPONIBLE {
  NEXT_BD_FF_BANDEAU_INDISPONIBILITE: boolean;
  NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TEXTE: string;
  NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TYPE: string;
  NEXT_PUBLIC_FF_NOUVELLE_PAGE_ACCUEIL: boolean;
  NEXT_PUBLIC_FF_RAPPORT_DETAILLE: boolean;
  NEXT_PUBLIC_FF_INFOBULLE_PONDERATION: boolean;
  NEXT_PUBLIC_FF_DATE_METEO: boolean;
  NEXT_PUBLIC_FF_ALERTES: boolean;
  NEXT_PUBLIC_FF_ALERTES_BAISSE: boolean;
  NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE: boolean;
  NEXT_PUBLIC_FF_FICHE_CONDUCTEUR: boolean;
  NEXT_PUBLIC_FF_GESTION_TOKEN_API: boolean;
  NEXT_PUBLIC_FF_TA_ANNUEL: boolean;
  NEXT_PUBLIC_FF_SUIVI_COMPLETUDE: boolean;
  NEXT_PUBLIC_FF_ALERTE_MAJ_INDICATEUR: boolean;
  NEXT_PUBLIC_FF_DOCS_API: boolean;
  NEXT_PUBLIC_FF_PPG_ARCHIVE: boolean;
  NEXT_PUBLIC_FF_POSER_UNE_QUESTION_INDICATEUR: boolean;
  NEXT_PUBLIC_FF_VIDEO_ACCUEIL: boolean;
  NEXT_PUBLIC_FF_PANEL_ADMIN: boolean;
  NEXT_PUBLIC_FF_MON_PROFIL: boolean;
  NEXT_PUBLIC_FF_ASK_AI: boolean;
  NEXT_PUBLIC_FF_CENTRE_AIDE_ADMIN: boolean;
  NEXT_PUBLIC_FF_CENTRE_AIDE_PILOTE: boolean;
  NEXT_PUBLIC_FF_PILOTE_EVAL: boolean;
  NEXT_PUBLIC_FF_RAPPORT_COORDINATEURS: boolean;
  NEXT_PUBLIC_FF_RAPPORT_PVA: boolean;
  NEXT_PUBLIC_FF_CREATION_COMPTE_ARS: boolean;
  NEXT_PUBLIC_FF_MASQUER_INDICATEURS_NON_APPLICABLES: boolean;
  NEXT_PUBLIC_FF_ACCES_PILOTE: boolean;
  NEXT_PUBLIC_FF_COMPARAISON_TERRITOIRES: boolean;
  NEXT_PUBLIC_FF_FICHE_TERRITORIALE: boolean;
  NEXT_PUBLIC_FF_PROPOSITION_VOIR_HISTORIQUE: boolean;
  NEXT_PUBLIC_FF_PVA_VALEUR_DIFFERENTE: boolean;
  NEXT_PUBLIC_FF_LIEN_CONTACT_BREVO: boolean;
  NEXT_PUBLIC_FF_REPARTITION_METEOS_V2: boolean;
  NEXT_PUBLIC_FF_CHANTIERS_SIGNALES_V2: boolean;
  NEXT_PUBLIC_FF_REFONTE_PAGE_CHANTIER: boolean;
  NEXT_PUBLIC_FF_REORGANISATION_PAGE_ACCUEIL: boolean;
}

type FeatureFlipConfig = ReturnType<typeof configurationFeatureFlip>;

interface FeatureFlipDefinition {
  envKey: string;
  configKey: keyof FeatureFlipConfig;
  label: string;
}

/** Source unique de vérité pour tous les feature flips */
const FEATURE_FLIP_DEFINITIONS: FeatureFlipDefinition[] = [
  {
    envKey: "NEXT_PUBLIC_FF_NOUVELLE_PAGE_ACCUEIL",
    configKey: "nouvellePageAccueil",
    label: "Nouvelle page d'accueil",
  },
  {
    envKey: "NEXT_PUBLIC_FF_RAPPORT_DETAILLE",
    configKey: "rapportDetaille",
    label: "Rapport détaillé",
  },
  {
    envKey: "NEXT_PUBLIC_FF_INFOBULLE_PONDERATION",
    configKey: "infobullePonderation",
    label: "Infobulle pondération",
  },
  {
    envKey: "NEXT_PUBLIC_FF_DATE_METEO",
    configKey: "dateMeteo",
    label: "Date météo",
  },
  { envKey: "NEXT_PUBLIC_FF_ALERTES", configKey: "alertes", label: "Alertes" },
  {
    envKey: "NEXT_PUBLIC_FF_ALERTES_BAISSE",
    configKey: "alertesBaisse",
    label: "Alertes baisse",
  },
  {
    envKey: "NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE",
    configKey: "applicationIndisponible",
    label: "Application indisponible",
  },
  {
    envKey: "NEXT_PUBLIC_FF_FICHE_CONDUCTEUR",
    configKey: "ficheConducteur",
    label: "Fiche conducteur",
  },
  {
    envKey: "NEXT_PUBLIC_FF_GESTION_TOKEN_API",
    configKey: "gestionTokenAPI",
    label: "Gestion token API",
  },
  {
    envKey: "NEXT_PUBLIC_FF_TA_ANNUEL",
    configKey: "taAnnuel",
    label: "TA annuel",
  },
  {
    envKey: "NEXT_PUBLIC_FF_SUIVI_COMPLETUDE",
    configKey: "suiviCompletude",
    label: "Suivi complétude",
  },
  {
    envKey: "NEXT_PUBLIC_FF_ALERTE_MAJ_INDICATEUR",
    configKey: "alerteMAJIndicateur",
    label: "Alerte MAJ indicateur",
  },
  {
    envKey: "NEXT_PUBLIC_FF_DOCS_API",
    configKey: "docsAPI",
    label: "Documentation API",
  },
  {
    envKey: "NEXT_PUBLIC_FF_PPG_ARCHIVE",
    configKey: "ppgArchive",
    label: "PPG archive",
  },
  {
    envKey: "NEXT_PUBLIC_FF_POSER_UNE_QUESTION_INDICATEUR",
    configKey: "poserUneQuestionIndicateur",
    label: "Poser une question indicateur",
  },
  {
    envKey: "NEXT_PUBLIC_FF_VIDEO_ACCUEIL",
    configKey: "videoAccueil",
    label: "Vidéo accueil",
  },
  {
    envKey: "NEXT_PUBLIC_FF_PANEL_ADMIN",
    configKey: "panelAdmin",
    label: "Panel administrateur",
  },
  {
    envKey: "NEXT_PUBLIC_FF_MON_PROFIL",
    configKey: "monProfil",
    label: "Mon profil",
  },
  { envKey: "NEXT_PUBLIC_FF_ASK_AI", configKey: "askAI", label: "Ask AI" },
  {
    envKey: "NEXT_PUBLIC_FF_CENTRE_AIDE_ADMIN",
    configKey: "centreAideAdmin",
    label: "Centre d'aide — onglet dans le panel admin",
  },
  {
    envKey: "NEXT_PUBLIC_FF_CENTRE_AIDE_PILOTE",
    configKey: "centreAidePilote",
    label: "Centre d'aide — onglet dans la navigation utilisateur",
  },
  {
    envKey: "NEXT_PUBLIC_FF_PILOTE_EVAL",
    configKey: "piloteEval",
    label: "Pilote Eval",
  },
  {
    envKey: "NEXT_PUBLIC_FF_RAPPORT_COORDINATEURS",
    configKey: "rapportCoordinateurs",
    label: "Rapport coordinateurs",
  },
  {
    envKey: "NEXT_PUBLIC_FF_RAPPORT_PVA",
    configKey: "rapportPva",
    label: "Rapport PVA",
  },
  {
    envKey: "NEXT_PUBLIC_FF_CREATION_COMPTE_ARS",
    configKey: "creationCompteArs",
    label: "Création compte ARS",
  },
  {
    envKey: "NEXT_PUBLIC_FF_MASQUER_INDICATEURS_NON_APPLICABLES",
    configKey: "masquerIndicateursNonApplicables",
    label: "Masquer indicateurs non applicables",
  },
  {
    envKey: "NEXT_PUBLIC_FF_ACCES_PILOTE",
    configKey: "accesPilote",
    label: "Accès Pilote",
  },
  {
    envKey: "NEXT_PUBLIC_FF_COMPARAISON_TERRITOIRES",
    configKey: "comparaisonTerritoires",
    label: "Comparaison territoires",
  },
  {
    envKey: "NEXT_PUBLIC_FF_FICHE_TERRITORIALE",
    configKey: "ficheTerritoriale",
    label: "Fiche territoriale",
  },
  {
    envKey: "NEXT_PUBLIC_FF_PROPOSITION_VOIR_HISTORIQUE",
    configKey: "voirHistoriqueProposition",
    label: "Voir historique des propositions",
  },
  {
    envKey: "NEXT_PUBLIC_FF_PVA_VALEUR_DIFFERENTE",
    configKey: "pvaValeurDifferente",
    label: "PVA valeur différente",
  },
  {
    envKey: "NEXT_PUBLIC_FF_LIEN_CONTACT_BREVO",
    configKey: "lienContactBrevo",
    label: "Lien contact Brevo",
  },
  {
    envKey: "NEXT_PUBLIC_FF_REPARTITION_METEOS_V2",
    configKey: "repartitionMeteosV2",
    label: "Répartition météos V2",
  },
  {
    envKey: "NEXT_PUBLIC_FF_CHANTIERS_SIGNALES_V2",
    configKey: "chantiersSignalesV2",
    label: "Chantiers signalés V2",
  },
  {
    envKey: "NEXT_PUBLIC_FF_REFONTE_PAGE_CHANTIER",
    configKey: "refontePageChantier",
    label: "Refonte page chantier",
  },
  {
    envKey: "NEXT_PUBLIC_FF_REORGANISATION_PAGE_ACCUEIL",
    configKey: "reorganisationPageAccueil",
    label: "Reorganisation page accueil en sections",
  },
];

/** Clés d'env de tous les feature flips — dérivé de FEATURE_FLIP_DEFINITIONS */
export const FEATURE_FLIP_KEYS = FEATURE_FLIP_DEFINITIONS.map(
  (definition) => definition.envKey,
) as unknown as readonly FeatureFlipKey[];

export type FeatureFlipKey = keyof Omit<
  VARIABLE_CONTENU_DISPONIBLE,
  | "NEXT_BD_FF_BANDEAU_INDISPONIBILITE"
  | "NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TEXTE"
  | "NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TYPE"
>;

export type FeatureFlipMap = Record<FeatureFlipKey, boolean>;

/** Labels lisibles pour l'interface d'administration — dérivé de FEATURE_FLIP_DEFINITIONS */
export const FEATURE_FLIP_LABELS: Record<FeatureFlipKey, string> =
  Object.fromEntries(
    FEATURE_FLIP_DEFINITIONS.map((definition) => [
      definition.envKey,
      definition.label,
    ]),
  ) as Record<FeatureFlipKey, string>;

/** Mapping clé d'env → clé de config — dérivé de FEATURE_FLIP_DEFINITIONS */
export const FEATURE_FLIP_CONFIG_KEY_MAP: Record<
  FeatureFlipKey,
  keyof FeatureFlipConfig
> = Object.fromEntries(
  FEATURE_FLIP_DEFINITIONS.map((definition) => [
    definition.envKey,
    definition.configKey,
  ]),
) as Record<FeatureFlipKey, keyof FeatureFlipConfig>;

/** Variables non-FF exposées via useEnv */
const VARIABLE_CONTENU_NON_FF = [
  "NEXT_PUBLIC_LIMITE_CARACTERES_PUBLICATION",
  "NEXT_PUBLIC_SCHEMA_VALIDATA_URL",
  "NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE",
] as const;

export const VARIABLE_CONTENU_DISPONIBLE_ENV = [
  ...FEATURE_FLIP_KEYS,
  ...VARIABLE_CONTENU_NON_FF,
] as const;

export type VariableContenuDisponibleEnv = Record<FeatureFlipKey, boolean> & {
  NEXT_PUBLIC_LIMITE_CARACTERES_PUBLICATION: number;
  NEXT_PUBLIC_SCHEMA_VALIDATA_URL: string;
  NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE: string;
};
