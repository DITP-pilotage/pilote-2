import {
  createColumnHelper,
  filterFn_arrHas,
  useTable,
} from "@tanstack/react-table";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { featuresTableauAdmin } from "./featuresTableauAdmin";

type LigneReferentiel = { id: string; statut: "ACTIF" | "SUPPRIME" };

const donnees: LigneReferentiel[] = [
  { id: "a", statut: "ACTIF" },
  { id: "b", statut: "SUPPRIME" },
  { id: "c", statut: "ACTIF" },
];

const columnHelper = createColumnHelper<
  typeof featuresTableauAdmin,
  LigneReferentiel
>();

const columns = columnHelper.columns([
  columnHelper.accessor("id", { id: "id", header: "ID" }),
  columnHelper.accessor("statut", {
    id: "statut",
    header: "Statut",
    enableColumnFilter: true,
    filterFn: filterFn_arrHas,
  }),
]);

const idsFiltresPar = (valeurs: string[]) => {
  const { result } = renderHook(() =>
    useTable({
      features: featuresTableauAdmin,
      data: donnees,
      columns,
      state: { columnFilters: [{ id: "statut", value: valeurs }] },
    }),
  );

  return result.current.getRowModel().rows.map((ligne) => ligne.original.id);
};

describe("filtre de colonne des tableaux admin", () => {
  it("garde les lignes dont la valeur figure parmi celles sélectionnées", () => {
    expect(idsFiltresPar(["ACTIF"])).toEqual(["a", "c"]);
  });

  it("accepte plusieurs valeurs sélectionnées", () => {
    expect(idsFiltresPar(["ACTIF", "SUPPRIME"])).toEqual(["a", "b", "c"]);
  });
});
