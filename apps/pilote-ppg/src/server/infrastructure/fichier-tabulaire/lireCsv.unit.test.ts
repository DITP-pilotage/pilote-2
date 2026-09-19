import { readFileSync } from "node:fs";
import { join } from "node:path";
import { construireCsv } from "@/server/infrastructure/fichier-tabulaire/fichierTabulaire.builder";
import { lireCsv } from "@/server/infrastructure/fichier-tabulaire/lireCsv";

const ENTETE = [
  "identifiant_indic",
  "zone_id",
  "zone_nom",
  "date_valeur",
  "type_valeur",
  "valeur",
];
const LIGNE = ["IND-001", "D46", "Lot", "2023-01-31", "vi", "12.5"];

describe("lireCsv", () => {
  it("lit un CSV séparé par des points-virgules", () => {
    expect(lireCsv(construireCsv([ENTETE, LIGNE]))).toEqual([ENTETE, LIGNE]);
  });

  it("lit un CSV séparé par des virgules", () => {
    expect(
      lireCsv(construireCsv([ENTETE, LIGNE], { delimiteur: "," })),
    ).toEqual([ENTETE, LIGNE]);
  });

  it("lit le template officiel distribué aux utilisateurs", () => {
    // Ce template est séparé par des points-virgules : sans détection du
    // délimiteur, il serait lu comme une colonne unique et l'import échouerait.
    const officiel = readFileSync(
      join(__dirname, "../../../../public/model/template_import_PILOTE.csv"),
    );

    expect(lireCsv(officiel)[0]).toEqual(ENTETE);
  });

  it("retire le BOM de la première cellule", () => {
    expect(lireCsv(construireCsv([ENTETE], { bom: true }))[0]).toEqual(ENTETE);
  });

  it("décode un fichier encodé en cp1252", () => {
    const contenu = construireCsv(
      [ENTETE, ["IND-001", "D46", "Rhône-Alpes", "2023-01-31", "vi", "1"]],
      { encodage: "cp1252" },
    );

    expect(lireCsv(contenu)[1][2]).toEqual("Rhône-Alpes");
  });

  it("accepte les fins de ligne LF comme les CRLF", () => {
    expect(
      lireCsv(construireCsv([ENTETE, LIGNE], { finDeLigne: "\n" })),
    ).toEqual([ENTETE, LIGNE]);
  });

  it("conserve une ligne vide intercalée, qui doit rester signalable", () => {
    const vide = ["", "", "", "", "", ""];
    const suivante = ["IND-002", "R84", "ARA", "2023-02-28", "va", "7"];

    expect(lireCsv(construireCsv([ENTETE, LIGNE, vide, suivante]))).toEqual([
      ENTETE,
      LIGNE,
      vide,
      suivante,
    ]);
  });
});
