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

// TODO (CHAN - Rapport) : gestion du multi territoire
export function estDansPerimetreTerritorial(params: {
  coordinateur: Coordinateur;
  codeTerritoireCompte: string | undefined;
}): boolean {
  const { coordinateur, codeTerritoireCompte } = params;
  if (!codeTerritoireCompte) return false;

  return coordinateur.territoires.some(
    (territoire) => territoire.code === codeTerritoireCompte,
  );
}
