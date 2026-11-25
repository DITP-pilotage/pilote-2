import type { Prisma } from "@prisma/client";

export const indicateursPubliesWhere = (params: {
  chantierIds: string[];
  territoireCodes?: string[];
  indicateurIds?: string[];
}): Prisma.indicateur_territoireWhereInput => ({
  chantier_id: { in: params.chantierIds },
  ...(params.territoireCodes
    ? { territoire_code: { in: params.territoireCodes } }
    : {}),
  ...(params.indicateurIds ? { id: { in: params.indicateurIds } } : {}),
  indicateur_identite: {
    statut: "PUBLIE",
    chantier_identite: { statut: "PUBLIE" },
  },
});

export const NON_A_JOUR_WHERE: Prisma.indicateur_territoireWhereInput = {
  est_applicable: true,
  OR: [{ est_a_jour: false }, { est_a_jour: null }],
};

export type EtatMiseAJour =
  "A_JOUR" | "NON_A_JOUR" | "SANS_DONNEE" | "NON_APPLICABLE";

export const etatMiseAJour = (ligne: {
  estApplicable: boolean | null;
  estAJour: boolean | null;
  dateDerniereValeur: Date | null;
}): EtatMiseAJour => {
  if (ligne.estApplicable !== true) return "NON_APPLICABLE";
  if (ligne.dateDerniereValeur === null) return "SANS_DONNEE";
  return ligne.estAJour === true ? "A_JOUR" : "NON_A_JOUR";
};

export const etatTerritoireChantier = (territoire: {
  estApplicable: boolean;
  nbIndicateursNonAJour: number;
  nbIndicateursSansDonnee: number;
}): EtatMiseAJour => {
  if (!territoire.estApplicable) return "NON_APPLICABLE";
  if (territoire.nbIndicateursNonAJour > 0) return "NON_A_JOUR";
  if (territoire.nbIndicateursSansDonnee > 0) return "SANS_DONNEE";
  return "A_JOUR";
};
