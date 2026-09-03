import { ProfilEnum } from "@/server/app/enum/profil.enum";
import type { VariableContenuDisponibleEnv } from "@/server/gestion-contenu/domain/VariableContenuDisponible";

const PROFILS_COORDINATEUR: string[] = [
  ProfilEnum.COORDINATEUR_REGION,
  ProfilEnum.COORDINATEUR_DEPARTEMENT,
];

export interface FeatureFlipsAskAI {
  askAI: boolean;
  ditpAdmin: boolean;
  equipeDirProjet: boolean;
  ditpPilotage: boolean;
  territoire: boolean;
  coordinateur: boolean;
}

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
  askAI: Boolean(variables.NEXT_PUBLIC_FF_ASK_AI),
  ditpAdmin: Boolean(variables.NEXT_PUBLIC_FF_ASK_AI_DITP_ADMIN),
  equipeDirProjet: Boolean(variables.NEXT_PUBLIC_FF_ASK_AI_EQUIPE_DIR_PROJET),
  ditpPilotage: Boolean(variables.NEXT_PUBLIC_FF_ASK_AI_DITP_PILOTAGE),
  territoire: Boolean(variables.NEXT_PUBLIC_FF_ASK_AI_TERRITOIRE),
  coordinateur: Boolean(variables.NEXT_PUBLIC_FF_ASK_AI_COORDINATEUR),
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
  if (profil === null) {
    return false;
  }
  if (featureFlips.ditpAdmin && profil === ProfilEnum.DITP_ADMIN) {
    return true;
  }
  if (featureFlips.equipeDirProjet && profil === ProfilEnum.EQUIPE_DIR_PROJET) {
    return true;
  }
  if (featureFlips.ditpPilotage && profil === ProfilEnum.DITP_PILOTAGE) {
    return true;
  }
  if (featureFlips.coordinateur && PROFILS_COORDINATEUR.includes(profil)) {
    return true;
  }
  return false;
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
