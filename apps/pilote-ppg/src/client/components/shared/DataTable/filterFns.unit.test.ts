import {
  createSearchFilterFn,
  filterFnOneOf,
} from "@/components/shared/DataTable/filterFns";

const ligne = <T>(valeur: T, original: object = {}) =>
  ({ getValue: () => valeur, original }) as never;

describe("filterFnOneOf", () => {
  it("laisse passer toutes les lignes quand aucune valeur n'est sélectionnée", () => {
    expect(filterFnOneOf(ligne("actif"), "statut", [], () => {})).toBe(true);
  });

  it("garde les lignes dont la valeur fait partie de la sélection", () => {
    expect(
      [ligne("actif"), ligne("inactif"), ligne("archive")].map((row) =>
        filterFnOneOf(row, "statut", ["actif", "archive"], () => {}),
      ),
    ).toEqual([true, false, true]);
  });

  it("accepte une valeur unique en guise de sélection", () => {
    expect(filterFnOneOf(ligne("actif"), "statut", "actif", () => {})).toBe(
      true,
    );
  });

  it("se retire automatiquement quand la sélection est vide", () => {
    expect(filterFnOneOf.autoRemove?.([])).toBe(true);
    expect(filterFnOneOf.autoRemove?.(["actif"])).toBe(false);
  });
});

describe("createSearchFilterFn", () => {
  const rechercher = createSearchFilterFn<{ nom: string; email: string }>(
    (utilisateur) => [utilisateur.nom, utilisateur.email],
  );

  it("trouve une ligne sans tenir compte de la casse ni des accents", () => {
    const utilisateur = { nom: "Élodie Martin", email: "elodie@gouv.fr" };
    expect(
      ["elodie", "MARTIN", "gouv.fr", "dupont"].map((recherche) =>
        rechercher(ligne(null, utilisateur), "", recherche, () => {}),
      ),
    ).toEqual([true, true, true, false]);
  });

  it("laisse passer toutes les lignes quand la recherche est vide", () => {
    expect(
      rechercher(ligne(null, { nom: "A", email: "a@b.c" }), "", "  ", () => {}),
    ).toBe(true);
  });
});
