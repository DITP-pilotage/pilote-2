import { useSession } from "next-auth/react";
import { useEnv } from "@/client/hooks/useEnv";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

function profilAutoriseParFeatureFlip(params: {
  profil: string | null;
  ffAskAIDitpAdmin: boolean;
  ffAskAIEquipeDirProjet: boolean;
}): boolean {
  if (params.ffAskAIDitpAdmin && params.profil === ProfilEnum.DITP_ADMIN) {
    return true;
  }
  if (
    params.ffAskAIEquipeDirProjet &&
    params.profil === ProfilEnum.EQUIPE_DIR_PROJET
  ) {
    return true;
  }
  return false;
}

export function useAskAIAccess() {
  const { data: session } = useSession();
  const ffAskAI = useEnv("NEXT_PUBLIC_FF_ASK_AI");
  const ffAskAIDitpAdmin = useEnv("NEXT_PUBLIC_FF_ASK_AI_DITP_ADMIN");
  const ffAskAIEquipeDirProjet = useEnv(
    "NEXT_PUBLIC_FF_ASK_AI_EQUIPE_DIR_PROJET",
  );

  const profil = session?.profil ?? null;

  const peutUtiliserAskAI =
    Boolean(ffAskAI) &&
    profilAutoriseParFeatureFlip({
      profil,
      ffAskAIDitpAdmin: Boolean(ffAskAIDitpAdmin),
      ffAskAIEquipeDirProjet: Boolean(ffAskAIEquipeDirProjet),
    });

  return {
    peutUtiliserAskAI,
    estDITPAdmin: profil === ProfilEnum.DITP_ADMIN,
    profil,
  };
}
