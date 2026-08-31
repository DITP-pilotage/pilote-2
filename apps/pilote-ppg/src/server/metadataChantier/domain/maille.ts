export const MAILLES = ["NAT", "REG", "DEPT"] as const;
export type Maille = (typeof MAILLES)[number];

export function calculerMaillesApplicablesIndicateur(
  indicTerritorialise: boolean,
  mailleLaPlusFine: string | null,
): Maille[] {
  if (!indicTerritorialise) return ["NAT"];
  if (mailleLaPlusFine === "DEPT") return ["NAT", "REG", "DEPT"];
  if (mailleLaPlusFine === "REG") return ["NAT", "REG"];
  return ["NAT"];
}
