import {
  construireCsv,
  construireXlsx,
  deposerDansUnFichierTemporaire,
} from "@/server/import-indicateur/app/builder/TabularFile.builder";
import { readTabularFile } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/tabular-file/readTabularFile";
import { FichierTabulaireIllisibleError } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/tabular-file/readZip";

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

describe("readTabularFile", () => {
  it("sépare l'en-tête des lignes de données", async () => {
    const chemin = deposerDansUnFichierTemporaire(
      "import.csv",
      construireCsv([ENTETE, LIGNE, SUIVANTE]),
    );

    const resultat = await readTabularFile(chemin, "import.csv");

    expect(resultat.entetes).toEqual(ENTETE);
    expect(resultat.lignes).toEqual([LIGNE, SUIVANTE]);
  });

  it("numérote les lignes comme le tableur, en-tête comprise", async () => {
    const chemin = deposerDansUnFichierTemporaire(
      "import.csv",
      construireCsv([ENTETE, LIGNE, ["", "", "", "", "", ""], SUIVANTE]),
    );

    const resultat = await readTabularFile(chemin, "import.csv");

    expect(resultat.numerosDeLigneSource).toEqual([2, 3, 4]);
  });

  it("choisit le lecteur d'après l'extension, insensible à la casse", async () => {
    const chemin = deposerDansUnFichierTemporaire(
      "import.xlsx",
      construireXlsx([ENTETE, LIGNE]),
    );

    const resultat = await readTabularFile(chemin, "IMPORT.XLSX");

    expect(resultat.entetes).toEqual(ENTETE);
  });

  it("refuse une extension non prise en charge", async () => {
    const chemin = deposerDansUnFichierTemporaire(
      "donnees.ods",
      construireCsv([ENTETE]),
    );

    await expect(readTabularFile(chemin, "donnees.ods")).rejects.toThrow(
      FichierTabulaireIllisibleError,
    );
  });

  it("refuse un fichier sans aucune ligne", async () => {
    const chemin = deposerDansUnFichierTemporaire("vide.csv", Buffer.from(""));

    await expect(readTabularFile(chemin, "vide.csv")).rejects.toThrow(/vide/i);
  });
});
