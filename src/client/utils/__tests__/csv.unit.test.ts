import {
  filtrerLesTerritoires,
  genererContenuCsv,
  telechargerCsv,
} from "@/client/utils/csv";

describe("filtrerParTerritoires", () => {
  it("ne retourne que les territoires applicables présents dans la liste d'export", () => {
    // Given
    const donnees = [
      { territoireCode: "DEP-01", estApplicable: true },
      { territoireCode: "DEP-02", estApplicable: true },
      { territoireCode: "DEP-03", estApplicable: false },
      { territoireCode: "DEP-04", estApplicable: null },
    ];

    // When
    const result = filtrerLesTerritoires(donnees, [
      "DEP-01",
      "DEP-02",
      "DEP-03",
    ]);

    // Then
    expect(result).toEqual([
      { territoireCode: "DEP-01", estApplicable: true },
      { territoireCode: "DEP-02", estApplicable: true },
    ]);
  });

  it("retourne un tableau vide si aucun territoire ne correspond", () => {
    // Given
    const donnees = [{ territoireCode: "DEP-01", estApplicable: true }];

    // When
    const result = filtrerLesTerritoires(donnees, ["DEP-99"]);

    // Then
    expect(result).toEqual([]);
  });
});

describe("genererContenuCsv", () => {
  it("génère un CSV avec BOM UTF-8, séparateur ; et valeurs entre guillemets", () => {
    // Given
    const lignes = [
      ["Territoire", "Taux d'avancement", "Date"],
      ["Ain", "42", "01/01/2025"],
    ];

    // When
    const result = genererContenuCsv(lignes);

    // Then
    expect(result).toEqual(
      '\uFEFF"Territoire";"Taux d\'avancement";"Date"\n"Ain";"42";"01/01/2025"',
    );
  });

  it("échappe les guillemets doubles internes en les doublant", () => {
    // Given
    const lignes = [['valeur "entre" guillemets']];

    // When
    const result = genererContenuCsv(lignes);

    // Then
    expect(result).toEqual('\uFEFF"valeur ""entre"" guillemets"');
  });

  it("génère un CSV avec uniquement la ligne d'en-têtes quand les lignes sont vides", () => {
    // Given
    const lignes = [["Territoire", "Taux d'avancement", "Date"]];

    // When
    const result = genererContenuCsv(lignes);

    // Then
    expect(result).toEqual('\uFEFF"Territoire";"Taux d\'avancement";"Date"');
  });
});

describe("telechargerCsv", () => {
  it("attache le lien au DOM, déclenche le téléchargement, puis nettoie", () => {
    // Given
    const createObjectURL = vi.fn(() => "blob:fake-url");
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    const appendChildMock = vi.spyOn(document.body, "appendChild");
    const removeChildMock = vi.spyOn(document.body, "removeChild");
    const clickMock = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click: clickMock,
    } as unknown as HTMLAnchorElement);

    // When
    telechargerCsv("contenu", "mon-export");

    // Then
    expect(appendChildMock).toHaveBeenCalledTimes(1);
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(removeChildMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });
});
