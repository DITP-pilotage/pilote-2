export type ProfilCoordinateur =
  | "COORDINATEUR_REGION"
  | "COORDINATEUR_DEPARTEMENT";

export type Coordinateur = {
  readonly id: string;
  readonly email: string;
  readonly nom: string;
  readonly prenom: string;
  readonly profil: ProfilCoordinateur;
  readonly territoire: {
    readonly code: string;
    readonly nom: string;
    readonly maille: "REG" | "DEPT";
    readonly codesEnfants: readonly string[];
  };
};

export function estDansPerimetreGeographique(params: {
  coordinateur: Coordinateur;
  codeTerritoireCompte: string | undefined;
}): boolean {
  const { coordinateur, codeTerritoireCompte } = params;
  if (!codeTerritoireCompte) return false;

  return (
    codeTerritoireCompte === coordinateur.territoire.code ||
    coordinateur.territoire.codesEnfants.includes(codeTerritoireCompte)
  );
}
