import type { Table } from "@tanstack/react-table";

export type StatutReferentiel = "ACTIF" | "SUPPRIME";

export const statutReferentielDe = (
  deletedAt: string | null,
): StatutReferentiel => (deletedAt === null ? "ACTIF" : "SUPPRIME");

/**
 * `globalFilter` est typé `unknown` par tanstack-table : useEtatTableauAdmin
 * le stocke toujours en string, donc c'est ici, en un seul endroit, que
 * l'hypothèse de type est faite plutôt que dans chaque composant qui lit
 * l'état de la table.
 */
export const lireRechercheGlobale = <TRow>(table: Table<TRow>): string =>
  (table.getState().globalFilter as string | undefined) ?? "";
