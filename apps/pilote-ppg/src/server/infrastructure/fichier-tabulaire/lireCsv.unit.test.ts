import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lireCsv } from "@/server/infrastructure/fichier-tabulaire/lireCsv";

const fixture = (nom: string) =>
  readFileSync(join(__dirname, "__fixtures__", nom));

describe("lireCsv", () => {
  it("lit un CSV séparé par des points-virgules", () => {
    const lignes = lireCsv(fixture("valide-pointvirgule.csv"));

    expect(lignes[0]).toEqual([
      "identifiant_indic",
      "zone_id",
      "zone_nom",
      "date_valeur",
      "type_valeur",
      "valeur",
    ]);
  });

  it("lit un CSV séparé par des virgules", () => {
    const lignes = lireCsv(fixture("valide-virgule.csv"));

    expect(lignes[0]).toEqual([
      "identifiant_indic",
      "zone_id",
      "zone_nom",
      "date_valeur",
      "type_valeur",
      "valeur",
    ]);
  });

  it("lit le template officiel distribué aux utilisateurs", () => {
    const officiel = readFileSync(
      join(__dirname, "../../../../public/model/template_import_PILOTE.csv"),
    );

    expect(lireCsv(officiel)[0]).toEqual([
      "identifiant_indic",
      "zone_id",
      "zone_nom",
      "date_valeur",
      "type_valeur",
      "valeur",
    ]);
  });

  it("retire le BOM de la première cellule", () => {
    expect(lireCsv(fixture("valide-bom.csv"))[0][0]).toBe("identifiant_indic");
  });

  it("décode un fichier encodé en cp1252", () => {
    expect(lireCsv(fixture("valide-cp1252.csv"))[1][2]).toBe("Rhône-Alpes");
  });

  it("accepte les fins de ligne LF comme les CRLF", () => {
    expect(lireCsv(fixture("valide-lf.csv"))[0]).toEqual([
      "identifiant_indic",
      "zone_id",
      "zone_nom",
      "date_valeur",
      "type_valeur",
      "valeur",
    ]);
  });

  it("conserve une ligne vide intercalée", () => {
    const lignes = lireCsv(fixture("ligne-vide-milieu.csv"));

    expect(lignes.slice(2)).toEqual([
      ["", "", "", "", "", ""],
      ["IND-002", "R84", "ARA", "2023-02-28", "va", "7"],
    ]);
  });
});
