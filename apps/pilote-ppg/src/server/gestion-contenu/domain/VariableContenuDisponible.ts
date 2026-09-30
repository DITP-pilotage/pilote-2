import { configuration } from "@/config";

export interface VARIABLE_CONTENU_DISPONIBLE {
  NEXT_BD_FF_BANDEAU_INDISPONIBILITE: boolean;
  NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TEXTE: string;
  NEXT_BD_FF_BANDEAU_INDISPONIBILITE_TYPE: string;
  NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE: boolean;
  NEXT_PUBLIC_FF_PPG_ARCHIVE: boolean;
  NEXT_PUBLIC_FF_POSER_UNE_QUESTION_INDICATEUR: boolean;
  NEXT_PUBLIC_FF_ASK_AI: boolean;
  NEXT_PUBLIC_FF_ASK_AI_DITP_ADMIN: boolean;
  NEXT_PUBLIC_FF_ASK_AI_EQUIPE_DIR_PROJET: boolean;
  NEXT_PUBLIC_FF_ASK_AI_DITP_PILOTAGE: boolean;
  NEXT_PUBLIC_FF_ASK_AI_TERRITOIRE: boolean;
  NEXT_PUBLIC_FF_ASK_AI_COORDINATEUR: boolean;
  NEXT_PUBLIC_FF_PILOTE_EVAL: boolean;
  NEXT_PUBLIC_FF_RAPPORT_COORDINATEURS: boolean;
  NEXT_PUBLIC_FF_RAPPORT_PVA: boolean;
  NEXT_PUBLIC_FF_RAPPORT_RESPONSABLES_DONNEES: boolean;
  NEXT_PUBLIC_FF_CREATION_COMPTE_ARS: boolean;
  NEXT_PUBLIC_FF_MASQUER_INDICATEURS_NON_APPLICABLES: boolean;
  NEXT_PUBLIC_FF_ACCES_PILOTE: boolean;
  NEXT_PUBLIC_FF_COMPARAISON_TERRITOIRES: boolean;
  NEXT_PUBLIC_FF_PVA_VALEUR_DIFFERENTE: boolean;
  NEXT_PUBLIC_FF_LIEN_CONTACT_BREVO: boolean;
  NEXT_PUBLIC_FF_REPARTITION_METEOS_V2: boolean;
  NEXT_PUBLIC_FF_CHANTIERS_SIGNALES_V2: boolean;
  NEXT_PUBLIC_FF_REFONTE_PAGE_CHANTIER: boolean;
  NEXT_PUBLIC_FF_REORGANISATION_PAGE_ACCUEIL: boolean;
  NEXT_PUBLIC_FF_EXPORT_CSV_WIDGETS: boolean;
  NEXT_PUBLIC_FF_PROCONNECT: boolean;
}

type FeatureFlipConfig = ReturnType<typeof configuration>["featureFlip"];

interface FeatureFlipDefinition {
  envKey: string;
  configKey: keyof FeatureFlipConfig;
  label: string;
}

/** Source unique de vérité pour tous les feature flips */
const FEATURE_FLIP_DEFINITIONS: FeatureFlipDefinition[] = [
  {
    envKey: "NEXT_PUBLIC_FF_APPLICATION_INDISPONIBLE",
    configKey: "applicationIndisponible",
    label: "Application indisponible",
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
  { envKey: "NEXT_PUBLIC_FF_ASK_AI", configKey: "askAI", label: "Ask AI" },
  {
    envKey: "NEXT_PUBLIC_FF_ASK_AI_DITP_ADMIN",
    configKey: "askAIDitpAdmin",
    label: "Ask AI — ouverture DITP Admin",
  },
  {
    envKey: "NEXT_PUBLIC_FF_ASK_AI_EQUIPE_DIR_PROJET",
    configKey: "askAIEquipeDirProjet",
    label: "Ask AI — ouverture Équipe Direction de Projet",
  },
  {
    envKey: "NEXT_PUBLIC_FF_ASK_AI_DITP_PILOTAGE",
    configKey: "askAIDitpPilotage",
    label: "Ask AI — ouverture DITP Pilotage",
  },
  {
    envKey: "NEXT_PUBLIC_FF_ASK_AI_TERRITOIRE",
    configKey: "askAITerritoire",
    label: "Ask AI — ouverture Territoire",
  },
  {
    envKey: "NEXT_PUBLIC_FF_ASK_AI_COORDINATEUR",
    configKey: "askAICoordinateur",
    label: "Ask AI — ouverture Coordinateurs région et département",
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
    envKey: "NEXT_PUBLIC_FF_RAPPORT_RESPONSABLES_DONNEES",
    configKey: "rapportResponsablesDonnees",
    label: "Rapport responsables de données",
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
    label: "Réorganisation page accueil en sections",
  },
  {
    envKey: "NEXT_PUBLIC_FF_PROCONNECT",
    configKey: "proconnect",
    label: "Connexion ProConnect",
  },
  {
    envKey: "NEXT_PUBLIC_FF_EXPORT_CSV_WIDGETS",
    configKey: "exportCsvWidgets",
    label: "Export csv des widgets",
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
  "NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE",
] as const;

export const VARIABLE_CONTENU_DISPONIBLE_ENV = [
  ...FEATURE_FLIP_KEYS,
  ...VARIABLE_CONTENU_NON_FF,
] as const;

export type VariableContenuDisponibleEnv = Record<FeatureFlipKey, boolean> & {
  NEXT_PUBLIC_LIMITE_CARACTERES_PUBLICATION: number;
  NEXT_PUBLIC_DATE_BASCULE_AFFICHAGE_VALEURS_ANNEE_PRECEDENTE: string;
};
