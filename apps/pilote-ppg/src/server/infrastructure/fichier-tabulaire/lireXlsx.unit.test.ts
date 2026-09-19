import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  construireXlsx,
  construireXlsxNumerote,
} from "@/server/infrastructure/fichier-tabulaire/fichierTabulaire.builder";
import { lireXlsx } from "@/server/infrastructure/fichier-tabulaire/lireXlsx";

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

describe("lireXlsx", () => {
  it("lit les en-têtes et les lignes de données", () => {
    expect(lireXlsx(construireXlsx([ENTETE, LIGNE])).lignes).toEqual([
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

    expect(lireXlsx(classeur).lignes).toEqual([ENTETE, LIGNE, [], SUIVANTE]);
  });

  it("ne décale pas les colonnes quand une cellule vide est intercalée", () => {
    const classeur = construireXlsx([
      ENTETE,
      ["IND-001", "D46", "", "2023-01-31", "vi", ""],
    ]);

    // La cellule intercalée garde sa place ; la cellule finale vide, absente du
    // XML, laisse la ligne plus courte que l'en-tête.
    expect(lireXlsx(classeur).lignes[1]).toEqual([
      "IND-001",
      "D46",
      "",
      "2023-01-31",
      "vi",
    ]);
  });

  it("n'expose aucun producteur quand docProps/app.xml est absent", () => {
    expect(lireXlsx(construireXlsx([ENTETE])).producteur).toBeNull();
  });

  it("lit le template XLSX officiel et nomme son producteur", () => {
    const officiel = readFileSync(
      join(__dirname, "../../../../public/model/template_import_PILOTE.xlsx"),
    );

    const { lignes, producteur } = lireXlsx(officiel);

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
    expect(() => lireXlsx(classeur)).toThrow(/trop de lignes/);
  });

  it("accepte le dernier numéro de ligne du format", () => {
    const classeur = construireXlsxNumerote([
      [1, ENTETE],
      [1_048_576, LIGNE],
    ]);

    expect(lireXlsx(classeur).lignes).toHaveLength(1_048_576);
  });
});
