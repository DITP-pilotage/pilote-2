import { genererContenuCsv, telechargerCsv } from "@/client/utils/csv";

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
  it("crée un lien de téléchargement avec le bon nom de fichier et le déclenche", () => {
    // Given
    const createObjectURL = vi.fn(() => "blob:fake-url");
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    const clickMock = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click: clickMock,
    } as unknown as HTMLAnchorElement);

    // When
    telechargerCsv("contenu", "mon-export");

    // Then
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
  });
});
