export type ProfilCoordinateur =
  | "COORDINATEUR_REGION"
  | "COORDINATEUR_DEPARTEMENT";

export type TerritoireCoordinateur = {
  readonly code: string;
  readonly nom: string;
  readonly maille: "REG" | "DEPT";
};

export type Coordinateur = {
  readonly id: string;
  readonly email: string;
  readonly nom: string;
  readonly prenom: string;
  readonly profil: ProfilCoordinateur;
  readonly territoires: readonly TerritoireCoordinateur[];
};

export function estDansPerimetreTerritorial(params: {
  coordinateur: Coordinateur;
  codesTerritoires: readonly string[];
}): boolean {
  const { coordinateur, codesTerritoires } = params;
  if (codesTerritoires.length === 0) return false;

  return coordinateur.territoires.some((territoire) =>
    codesTerritoires.includes(territoire.code),
  );
}
