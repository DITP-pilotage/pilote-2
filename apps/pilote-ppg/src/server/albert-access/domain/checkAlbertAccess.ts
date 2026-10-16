import { ProfilEnum } from "@/shared/profil/ProfilEnum";

export type AlbertScenarios = "ditp" | "coordinateur";

export interface AlbertAccess {
  peutUtiliser: boolean;
  scenarios: AlbertScenarios;
}

const PROFILS_SCENARIOS_DITP: ReadonlySet<string> = new Set([
  ProfilEnum.DITP_ADMIN,
  ProfilEnum.DITP_PILOTAGE,
]);

export const checkAlbertAccess = ({
  killSwitch,
  profil,
  profilActive,
  utilisateurAutorise,
}: {
  killSwitch: boolean;
  profil: string | null;
  profilActive: boolean;
  utilisateurAutorise: boolean;
}): AlbertAccess => ({
  peutUtiliser:
    killSwitch &&
    (profil === ProfilEnum.DITP_ADMIN || profilActive || utilisateurAutorise),
  scenarios:
    profil !== null && PROFILS_SCENARIOS_DITP.has(profil)
      ? "ditp"
      : "coordinateur",
});
