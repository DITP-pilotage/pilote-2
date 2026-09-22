export type StatutReferentiel = "ACTIF" | "SUPPRIME";

export const statutReferentielDe = (
  deletedAt: string | null,
): StatutReferentiel => (deletedAt === null ? "ACTIF" : "SUPPRIME");
