import { MailleTerritoireSelectionne } from "@/server/domain/maille/Maille.interface";

export type Maille = MailleTerritoireSelectionne;
export const MAILLES: readonly Maille[] = ["NAT", "REG", "DEPT"];

export const LIBELLÉ_MAILLE: Record<Maille, string> = {
  NAT: "National",
  REG: "Régional",
  DEPT: "Départemental",
};

export function calculerMaillesApplicablesIndicateur(
  indicTerritorialise: boolean,
  mailleLaPlusFine: string | null,
): Maille[] {
  if (!indicTerritorialise) return ["NAT"];
  if (mailleLaPlusFine === "DEPT") return ["NAT", "REG", "DEPT"];
  if (mailleLaPlusFine === "REG") return ["NAT", "REG"];
  return ["NAT"];
}
