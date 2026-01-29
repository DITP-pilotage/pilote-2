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
  chantiers: string[];
};

export function aDesDroitsSurTerritoire(params: {
  coordinateur: Coordinateur;
  codesTerritoires: string[];
}): boolean {
  const { coordinateur, codesTerritoires } = params;
  if (codesTerritoires.length === 0) return false;

  const getAllCodes = (territoire: TerritoireCoordinateur): string[] => [
    territoire.code,
    ...territoire.enfants.flatMap(getAllCodes),
  ];

  const tousLesCodesCoordinateur =
    coordinateur.territoires.flatMap(getAllCodes);

  return codesTerritoires.some((code) =>
    tousLesCodesCoordinateur.includes(code),
  );
}
