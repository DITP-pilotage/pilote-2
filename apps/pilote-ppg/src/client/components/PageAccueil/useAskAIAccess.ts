import { useSession } from "next-auth/react";
import { useEnv } from "@/client/hooks/useEnv";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import {
  calculerAccesAskAI,
  construireFeatureFlipsAskAI,
} from "@/server/albert/accesAskAI";

export function useAskAIAccess({
  emailAutoriseAskAITerritoire,
}: {
  emailAutoriseAskAITerritoire: boolean;
}) {
  const { data: session } = useSession();
  const ffAskAI = useEnv("NEXT_PUBLIC_FF_ASK_AI");
  const ffAskAIDitpAdmin = useEnv("NEXT_PUBLIC_FF_ASK_AI_DITP_ADMIN");
  const ffAskAIEquipeDirProjet = useEnv(
    "NEXT_PUBLIC_FF_ASK_AI_EQUIPE_DIR_PROJET",
  );
  const ffAskAIDitpPilotage = useEnv("NEXT_PUBLIC_FF_ASK_AI_DITP_PILOTAGE");
  const ffAskAITerritoire = useEnv("NEXT_PUBLIC_FF_ASK_AI_TERRITOIRE");
  const ffAskAICoordinateur = useEnv("NEXT_PUBLIC_FF_ASK_AI_COORDINATEUR");

  const profil = session?.profil ?? null;

  const { peutUtiliserAskAI, estEligibleTerritoire } = calculerAccesAskAI({
    profil,
    emailAutoriseAskAITerritoire,
    featureFlips: construireFeatureFlipsAskAI({
      NEXT_PUBLIC_FF_ASK_AI: ffAskAI,
      NEXT_PUBLIC_FF_ASK_AI_DITP_ADMIN: ffAskAIDitpAdmin,
      NEXT_PUBLIC_FF_ASK_AI_EQUIPE_DIR_PROJET: ffAskAIEquipeDirProjet,
      NEXT_PUBLIC_FF_ASK_AI_DITP_PILOTAGE: ffAskAIDitpPilotage,
      NEXT_PUBLIC_FF_ASK_AI_TERRITOIRE: ffAskAITerritoire,
      NEXT_PUBLIC_FF_ASK_AI_COORDINATEUR: ffAskAICoordinateur,
    }),
  });

  return {
    peutUtiliserAskAI,
    estDITPAdmin: profil === ProfilEnum.DITP_ADMIN,
    estEligibleTerritoire,
    profil,
  };
}
