import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  construireXlsx,
  construireXlsxNumerote,
} from "@/server/import-indicateur/app/builder/TabularFile.builder";
import { readXlsx } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/tabular-file/readXlsx";

const ENTETE = [
  "identifiant_indic",
  "zone_id",
  "zone_nom",
  "date_valeur",
  "type_valeur",
  "valeur",
];
const LIGNE = ["IND-001", "D46", "Lot", "2023-01-31", "vi", "12.5"];
const SUIVANTE = ["IND-002", "R84", "ARA", "2023-02-28", "va", "7"];

describe("readXlsx", () => {
  it("lit les en-têtes et les lignes de données", () => {
    expect(readXlsx(construireXlsx([ENTETE, LIGNE])).lignes).toEqual([
      ENTETE,
      LIGNE,
    ]);
  });

  it("ne décale pas la numérotation quand une ligne vide est intercalée", () => {
    const classeur = construireXlsx([
      ENTETE,
      LIGNE,
      ["", "", "", "", "", ""],
      SUIVANTE,
    ]);

    expect(readXlsx(classeur).lignes).toEqual([ENTETE, LIGNE, [], SUIVANTE]);
  });

  it("ne décale pas les colonnes quand une cellule vide est intercalée", () => {
    const classeur = construireXlsx([
      ENTETE,
      ["IND-001", "D46", "", "2023-01-31", "vi", ""],
    ]);

    // La cellule intercalée garde sa place ; la cellule finale vide, absente du
    // XML, laisse la ligne plus courte que l'en-tête.
    expect(readXlsx(classeur).lignes[1]).toEqual([
      "IND-001",
      "D46",
      "",
      "2023-01-31",
      "vi",
    ]);
  });

  it("rend au format AAAA-MM-JJ une cellule au format date du tableur", () => {
    const classeur = construireXlsx([[{ date: "2023-12-30" }]]);

    expect(readXlsx(classeur).lignes).toEqual([["2023-12-30"]]);
  });

  it("reconnaît une date sous un format personnalisé avec code de langue", () => {
    const classeur = construireXlsx([[{ date: "2024-02-29" }]], {
      formatDate: "[$-40C]dd/mm/yyyy;@",
    });

    expect(readXlsx(classeur).lignes).toEqual([["2024-02-29"]]);
  });

  it("tient compte du calendrier 1904 des classeurs Mac", () => {
    const classeur = construireXlsx([[{ date: "2023-12-30" }]], {
      date1904: true,
    });

    expect(readXlsx(classeur).lignes).toEqual([["2023-12-30"]]);
  });

  it("laisse tel quel un nombre au format Standard", () => {
    const classeur = construireXlsx([[{ nombre: "45290" }]]);

    expect(readXlsx(classeur).lignes).toEqual([["45290"]]);
  });

  it("laisse tel quel un nombre au format monétaire", () => {
    // Les guillemets et crochets d'un format peuvent contenir des d, m, y, h
    // ou s sans en faire un format de date.
    const classeur = construireXlsx([[{ date: "2023-12-30" }]], {
      formatDate: '#,##0.00 "dh";[Red]-#,##0.00 "dh"',
    });

    expect(readXlsx(classeur).lignes).toEqual([["45290"]]);
  });

  it("n'expose aucun producteur quand docProps/app.xml est absent", () => {
    expect(readXlsx(construireXlsx([ENTETE])).producteur).toBeNull();
  });

  it("lit le template XLSX officiel et nomme son producteur", () => {
    const officiel = readFileSync(
      join(process.cwd(), "public", "model", "template_import_PILOTE.xlsx"),
    );

    const { lignes, producteur } = readXlsx(officiel);

    expect(lignes[0]).toEqual(ENTETE);
    expect(producteur).not.toBeNull();
  });

  it("refuse un numéro de ligne au-delà de ce que le format autorise", () => {
    // Le nombre de lignes rendues suit le plus grand numéro déclaré, pas le
    // nombre de balises : quelques centaines d'octets suffisent sinon à faire
    // allouer plusieurs gigaoctets.
    const classeur = construireXlsxNumerote([
      [1, ENTETE],
      [100_000_000, LIGNE],
    ]);

    expect(classeur.length).toBeLessThan(2_000);
    expect(() => readXlsx(classeur)).toThrow(/trop de lignes/);
  });

  it("accepte le dernier numéro de ligne du format", () => {
    const classeur = construireXlsxNumerote([
      [1, ENTETE],
      [1_048_576, LIGNE],
    ]);

    expect(readXlsx(classeur).lignes).toHaveLength(1_048_576);
  });

  it("refuse une colonne au-delà de ce que le format autorise", () => {
    const ligne: string[] = [];
    ligne[16_384] = "IND-001";
    const classeur = construireXlsxNumerote([[1, ligne]]);

    expect(classeur.length).toBeLessThan(2_000);
    expect(() => readXlsx(classeur)).toThrow(/trop de colonnes/);
  });

  it("accepte la dernière colonne du format", () => {
    const ligne: string[] = [];
    ligne[16_383] = "IND-001";
    const classeur = construireXlsxNumerote([[1, ligne]]);

    expect(readXlsx(classeur).lignes[0]).toHaveLength(16_384);
  });
});
