import { ProfilEnum } from "@/server/app/enum/profil.enum";
import type { VariableContenuDisponibleEnv } from "@/server/gestion-contenu/domain/VariableContenuDisponible";

export interface FeatureFlipsAskAI {
  askAI: boolean;
  ditpAdmin: boolean;
  equipeDirProjet: boolean;
  ditpPilotage: boolean;
  territoire: boolean;
  coordinateur: boolean;
}

const FEATURE_FLIP_PAR_PROFIL: Partial<
  Record<string, keyof FeatureFlipsAskAI>
> = {
  [ProfilEnum.DITP_ADMIN]: "ditpAdmin",
  [ProfilEnum.EQUIPE_DIR_PROJET]: "equipeDirProjet",
  [ProfilEnum.DITP_PILOTAGE]: "ditpPilotage",
  [ProfilEnum.COORDINATEUR_REGION]: "coordinateur",
  [ProfilEnum.COORDINATEUR_DEPARTEMENT]: "coordinateur",
};

type VariablesAskAI = Pick<
  VariableContenuDisponibleEnv,
  | "NEXT_PUBLIC_FF_ASK_AI"
  | "NEXT_PUBLIC_FF_ASK_AI_DITP_ADMIN"
  | "NEXT_PUBLIC_FF_ASK_AI_EQUIPE_DIR_PROJET"
  | "NEXT_PUBLIC_FF_ASK_AI_DITP_PILOTAGE"
  | "NEXT_PUBLIC_FF_ASK_AI_TERRITOIRE"
  | "NEXT_PUBLIC_FF_ASK_AI_COORDINATEUR"
>;

export const construireFeatureFlipsAskAI = (
  variables: VariablesAskAI,
): FeatureFlipsAskAI => ({
  askAI: variables.NEXT_PUBLIC_FF_ASK_AI,
  ditpAdmin: variables.NEXT_PUBLIC_FF_ASK_AI_DITP_ADMIN,
  equipeDirProjet: variables.NEXT_PUBLIC_FF_ASK_AI_EQUIPE_DIR_PROJET,
  ditpPilotage: variables.NEXT_PUBLIC_FF_ASK_AI_DITP_PILOTAGE,
  territoire: variables.NEXT_PUBLIC_FF_ASK_AI_TERRITOIRE,
  coordinateur: variables.NEXT_PUBLIC_FF_ASK_AI_COORDINATEUR,
});

interface ParametresAccesAskAI {
  profil: string | null;
  emailAutoriseAskAITerritoire: boolean;
  featureFlips: FeatureFlipsAskAI;
}

const profilAutoriseParFeatureFlip = ({
  profil,
  featureFlips,
}: ParametresAccesAskAI): boolean => {
  const featureFlip =
    profil === null ? undefined : FEATURE_FLIP_PAR_PROFIL[profil];

  return featureFlip !== undefined && featureFlips[featureFlip];
};

export const calculerAccesAskAI = (
  parametres: ParametresAccesAskAI,
): { peutUtiliserAskAI: boolean; estEligibleTerritoire: boolean } => {
  const estEligibleTerritoire =
    parametres.featureFlips.territoire &&
    parametres.emailAutoriseAskAITerritoire;

  const peutUtiliserAskAI =
    parametres.featureFlips.askAI &&
    (profilAutoriseParFeatureFlip(parametres) || estEligibleTerritoire);

  return { peutUtiliserAskAI, estEligibleTerritoire };
};
