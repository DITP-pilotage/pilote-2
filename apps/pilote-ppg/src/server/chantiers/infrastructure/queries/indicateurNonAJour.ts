import type { $Enums, Prisma } from "@prisma/client";
import { toISODate } from "@/server/app/domain/Dates";

export const perimetreIndicateursPubliesWhere = (params: {
  chantierIds: string[];
  territoireCodes?: string[];
  indicateurIds?: string[];
  mailles?: $Enums.Maille[];
}): Prisma.indicateur_territoireWhereInput => ({
  chantier_id: { in: params.chantierIds },
  ...(params.territoireCodes
    ? { territoire_code: { in: params.territoireCodes } }
    : {}),
  ...(params.indicateurIds ? { id: { in: params.indicateurIds } } : {}),
  ...(params.mailles ? { maille: { in: params.mailles } } : {}),
  indicateur_identite: {
    statut: "PUBLIE",
    chantier_identite: { statut: "PUBLIE" },
  },
});

export const NON_A_JOUR_WHERE: Prisma.indicateur_territoireWhereInput = {
  est_applicable: true,
  OR: [{ est_a_jour: false }, { est_a_jour: null }],
};

export const estNonAJour = (row: {
  est_applicable: boolean | null;
  est_a_jour: boolean | null;
}) => row.est_applicable === true && row.est_a_jour !== true;

export const formatDate = (date: Date | null) =>
  date ? toISODate(date) : null;
