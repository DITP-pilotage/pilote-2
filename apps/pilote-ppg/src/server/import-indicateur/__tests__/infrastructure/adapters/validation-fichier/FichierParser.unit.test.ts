import ExcelJS from "exceljs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parserFichier } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/FichierParser";

describe("parserFichier", () => {
  describe("quand le fichier est un CSV", () => {
    it("doit parser les en-têtes et les lignes de données", async () => {
      const cheminFichier = path.join(
        os.tmpdir(),
        `fichier-test-${Date.now()}.csv`,
      );
      fs.writeFileSync(
        cheminFichier,
        "identifiant_indic,zone_id,date_valeur,type_valeur,valeur\nIND-001,D001,2023-01-31,vi,9\n",
      );

      const lignes = await parserFichier(cheminFichier, "fichier.csv");

      expect(lignes).toEqual([
        [
          "identifiant_indic",
          "zone_id",
          "date_valeur",
          "type_valeur",
          "valeur",
        ],
        ["IND-001", "D001", "2023-01-31", "vi", "9"],
      ]);

      fs.unlinkSync(cheminFichier);
    });
  });

  describe("quand le fichier est un XLSX", () => {
    it("doit parser les en-têtes et les lignes de données", async () => {
      const cheminFichier = path.join(
        os.tmpdir(),
        `fichier-test-${Date.now()}.xlsx`,
      );
      const workbook = new ExcelJS.Workbook();
      const feuille = workbook.addWorksheet("Feuille1");
      feuille.addRow([
        "identifiant_indic",
        "zone_id",
        "date_valeur",
        "type_valeur",
        "valeur",
      ]);
      feuille.addRow(["IND-001", "D001", "2023-01-31", "vi", 9]);
      await workbook.xlsx.writeFile(cheminFichier);

      const lignes = await parserFichier(cheminFichier, "fichier.xlsx");

      expect(lignes).toEqual([
        [
          "identifiant_indic",
          "zone_id",
          "date_valeur",
          "type_valeur",
          "valeur",
        ],
        ["IND-001", "D001", "2023-01-31", "vi", "9"],
      ]);

      fs.unlinkSync(cheminFichier);
    });

    it("doit convertir une cellule de type Date au format AAAA-MM-JJ", async () => {
      const cheminFichier = path.join(
        os.tmpdir(),
        `fichier-test-${Date.now()}.xlsx`,
      );
      const workbook = new ExcelJS.Workbook();
      const feuille = workbook.addWorksheet("Feuille1");
      feuille.addRow([
        "identifiant_indic",
        "zone_id",
        "date_valeur",
        "type_valeur",
        "valeur",
      ]);
      feuille.addRow([
        "IND-001",
        "D001",
        new Date(Date.UTC(2023, 0, 31)),
        "vi",
        9,
      ]);
      await workbook.xlsx.writeFile(cheminFichier);

      const lignes = await parserFichier(cheminFichier, "fichier.xlsx");

      expect(lignes[1][2]).toEqual("2023-01-31");

      fs.unlinkSync(cheminFichier);
    });
  });

  describe("quand le format du fichier n'est pas supporté", () => {
    it("doit lever une erreur", async () => {
      await expect(parserFichier("chemin", "fichier.txt")).rejects.toThrow(
        "Format de fichier non supporté : .txt",
      );
    });
  });
});
