export type ProfilCoordinateur =
  | "COORDINATEUR_REGION"
  | "COORDINATEUR_DEPARTEMENT";

export type TerritoireCoordinateur = {
  code: string;
  nom: string;
  maille: "REG" | "DEPT";
  enfants: TerritoireCoordinateur[];
};

export type Coordinateur = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  profil: ProfilCoordinateur;
  territoires: TerritoireCoordinateur[];
};

export const getTerritoiresCoordinateur = (coordinateur: Coordinateur) => {
  return coordinateur.territoires.flatMap((territoire) => [
    territoire.code,
    ...territoire.enfants.map((enfant) => enfant.code),
  ]);
};

export function aDesDroitsSurTerritoire(params: {
  coordinateur: Coordinateur;
  codesTerritoires: string[];
}): boolean {
  const { coordinateur, codesTerritoires } = params;
  if (codesTerritoires.length === 0) return false;

  const tousLesCodesCoordinateur = getTerritoiresCoordinateur(coordinateur);

  return codesTerritoires.some((code) =>
    tousLesCodesCoordinateur.includes(code),
  );
}
