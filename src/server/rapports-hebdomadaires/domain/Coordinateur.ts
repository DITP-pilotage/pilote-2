export type ProfilCoordinateur =
  | "COORDINATEUR_REGION"
  | "COORDINATEUR_DEPARTEMENT";

export type TerritoireCoordinateur = {
  code: string;
  nom: string;
  maille: "REG" | "DEPT";
};

export type Coordinateur = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  profil: ProfilCoordinateur;
  territoires: TerritoireCoordinateur[];
};

export function estDansPerimetreTerritorial(params: {
  coordinateur: Coordinateur;
  codesTerritoires: string[];
}): boolean {
  const { coordinateur, codesTerritoires } = params;
  if (codesTerritoires.length === 0) return false;

  return coordinateur.territoires.some((territoire) =>
    codesTerritoires.includes(territoire.code),
  );
}
