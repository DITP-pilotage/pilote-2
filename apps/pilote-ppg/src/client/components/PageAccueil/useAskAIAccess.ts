import { useSession } from "next-auth/react";
import { useEnv } from "@/client/hooks/useEnv";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

function parseEmailsAutorises(raw: string): Set<string> {
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0),
  );
}

function profilAutoriseParFeatureFlip(params: {
  profil: string | null;
  ffAskAIDitpAdmin: boolean;
  ffAskAIEquipeDirProjet: boolean;
  ffAskAIDitpPilotage: boolean;
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
  if (
    params.ffAskAIDitpPilotage &&
    params.profil === ProfilEnum.DITP_PILOTAGE
  ) {
    return true;
  }
  return false;
}

function emailAutoriseParListeTerritoire(params: {
  email: string | null;
  ffAskAITerritoire: boolean;
  emailsAutorises: Set<string>;
}): boolean {
  if (!params.ffAskAITerritoire) return false;
  if (!params.email) return false;
  return params.emailsAutorises.has(params.email.toLowerCase());
}

export function useAskAIAccess() {
  const { data: session } = useSession();
  const ffAskAI = useEnv("NEXT_PUBLIC_FF_ASK_AI");
  const ffAskAIDitpAdmin = useEnv("NEXT_PUBLIC_FF_ASK_AI_DITP_ADMIN");
  const ffAskAIEquipeDirProjet = useEnv(
    "NEXT_PUBLIC_FF_ASK_AI_EQUIPE_DIR_PROJET",
  );
  const ffAskAIDitpPilotage = useEnv("NEXT_PUBLIC_FF_ASK_AI_DITP_PILOTAGE");
  const ffAskAITerritoire = useEnv("NEXT_PUBLIC_FF_ASK_AI_TERRITOIRE");
  const emailsTerritoireRaw = useEnv("NEXT_PUBLIC_ASK_AI_TERRITOIRE_EMAILS");

  const profil = session?.profil ?? null;
  const email = session?.user?.email ?? null;
  const emailsAutorises = parseEmailsAutorises(emailsTerritoireRaw);

  const autoriseParProfil = profilAutoriseParFeatureFlip({
    profil,
    ffAskAIDitpAdmin: Boolean(ffAskAIDitpAdmin),
    ffAskAIEquipeDirProjet: Boolean(ffAskAIEquipeDirProjet),
    ffAskAIDitpPilotage: Boolean(ffAskAIDitpPilotage),
  });

  const estEligibleTerritoire = emailAutoriseParListeTerritoire({
    email,
    ffAskAITerritoire: Boolean(ffAskAITerritoire),
    emailsAutorises,
  });

  const peutUtiliserAskAI =
    Boolean(ffAskAI) && (autoriseParProfil || estEligibleTerritoire);

  return {
    peutUtiliserAskAI,
    estDITPAdmin: profil === ProfilEnum.DITP_ADMIN,
    estEligibleTerritoire,
    profil,
  };
}
