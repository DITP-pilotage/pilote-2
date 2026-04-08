import { formaterDateCsv, genererCsv } from "./genererCsv";

describe("genererCsv", () => {
  it("produit un en-tête avec séparateur point-virgule", () => {
    // Given
    const colonnes = ["Territoire", "Taux d'avancement", "Date"];
    const lignes: string[][] = [];

    // When
    const résultat = genererCsv(colonnes, lignes);

    // Then
    expect(résultat).toEqual("\uFEFFTerritoire;Taux d'avancement;Date\n");
  });

  it("préfixe le contenu avec le BOM UTF-8", () => {
    // Given
    const colonnes = ["Col"];
    const lignes: string[][] = [];

    // When
    const résultat = genererCsv(colonnes, lignes);

    // Then
    expect(résultat.startsWith("\uFEFF")).toEqual(true);
  });

  it("sépare les cellules par point-virgule", () => {
    // Given
    const colonnes = ["A", "B", "C"];
    const lignes = [["val1", "val2", "val3"]];

    // When
    const résultat = genererCsv(colonnes, lignes);

    // Then
    expect(résultat).toEqual("\uFEFFA;B;C\nval1;val2;val3");
  });

  it("sépare les lignes par retour à la ligne", () => {
    // Given
    const colonnes = ["Territoire", "Valeur"];
    const lignes = [
      ["Île-de-France", "42"],
      ["Bretagne", "17"],
    ];

    // When
    const résultat = genererCsv(colonnes, lignes);

    // Then
    expect(résultat).toEqual(
      "\uFEFFTerritoire;Valeur\nÎle-de-France;42\nBretagne;17",
    );
  });
});

describe("formaterDateCsv", () => {
  it("retourne 'Non renseigné' pour null", () => {
    expect(formaterDateCsv(null)).toEqual("Non renseigné");
  });

  it("retourne 'Non renseigné' pour une chaîne vide", () => {
    expect(formaterDateCsv("")).toEqual("Non renseigné");
  });

  it("formate une date ISO en DD/MM/YYYY heure Europe/Paris", () => {
    // Given
    // 2024-03-15T10:00:00Z = 15/03/2024 en Europe/Paris
    const dateIso = "2024-03-15T10:00:00.000Z";

    // When
    const résultat = formaterDateCsv(dateIso);

    // Then
    expect(résultat).toEqual("15/03/2024");
  });

  it("gère correctement le décalage horaire Europe/Paris (heure d'été)", () => {
    // Given
    // 2024-06-30T22:00:00Z = 01/07/2024 00:00 en Europe/Paris (UTC+2)
    const dateIso = "2024-06-30T22:00:00.000Z";

    // When
    const résultat = formaterDateCsv(dateIso);

    // Then
    expect(résultat).toEqual("01/07/2024");
  });
});
