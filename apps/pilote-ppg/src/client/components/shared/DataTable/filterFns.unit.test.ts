import { renderHook } from "@testing-library/react";
import { stockFeatures, useTable } from "@tanstack/react-table";
import {
  createSearchFilterFn,
  filterFnOneOf,
} from "@/components/shared/DataTable/filterFns";

type Utilisateur = { statut: string; nom: string; email: string };

const lignes = (...utilisateurs: Partial<Utilisateur>[]) =>
  renderHook(() =>
    useTable<typeof stockFeatures, Partial<Utilisateur>>({
      features: stockFeatures,
      data: utilisateurs,
      columns: [{ accessorKey: "statut" }],
    }),
  ).result.current.getCoreRowModel().rows;

const ligne = (utilisateur: Partial<Utilisateur>) => {
  const [premiereLigne] = lignes(utilisateur);
  return premiereLigne;
};

describe("filterFnOneOf", () => {
  it("laisse passer toutes les lignes quand aucune valeur n'est sélectionnée", () => {
    expect(
      filterFnOneOf(ligne({ statut: "actif" }), "statut", [], () => {}),
    ).toBe(true);
  });

  it("garde les lignes dont la valeur fait partie de la sélection", () => {
    expect(
      lignes(
        { statut: "actif" },
        { statut: "inactif" },
        { statut: "archive" },
      ).map((row) =>
        filterFnOneOf(row, "statut", ["actif", "archive"], () => {}),
      ),
    ).toEqual([true, false, true]);
  });

  it("accepte une valeur unique en guise de sélection", () => {
    expect(
      filterFnOneOf(ligne({ statut: "actif" }), "statut", "actif", () => {}),
    ).toBe(true);
  });

  it("se retire automatiquement quand la sélection est vide", () => {
    expect(filterFnOneOf.autoRemove?.([])).toBe(true);
    expect(filterFnOneOf.autoRemove?.(["actif"])).toBe(false);
  });
});

describe("createSearchFilterFn", () => {
  const rechercher = createSearchFilterFn<Partial<Utilisateur>>(
    (utilisateur) => [utilisateur.nom ?? "", utilisateur.email ?? ""],
  );

  it("trouve une ligne sans tenir compte de la casse ni des accents", () => {
    const utilisateur = { nom: "Élodie Martin", email: "elodie@gouv.fr" };
    expect(
      ["elodie", "MARTIN", "gouv.fr", "dupont"].map((recherche) =>
        rechercher(ligne(utilisateur), "", recherche, () => {}),
      ),
    ).toEqual([true, true, true, false]);
  });

  it("laisse passer toutes les lignes quand la recherche est vide", () => {
    expect(
      rechercher(ligne({ nom: "A", email: "a@b.c" }), "", "  ", () => {}),
    ).toBe(true);
  });
});
