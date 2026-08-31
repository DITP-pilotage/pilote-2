import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";

function convertirCelluleEnTexte(valeur: ExcelJS.CellValue): string {
  if (valeur === null || valeur === undefined) {
    return "";
  }
  if (valeur instanceof Date) {
    return valeur.toISOString().split("T")[0];
  }
  return String(valeur).trim();
}

async function parserXlsx(cheminCompletDuFichier: string): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(cheminCompletDuFichier);
  const feuille = workbook.worksheets[0];
  const lignes: string[][] = [];

  feuille.eachRow({ includeEmpty: false }, (row) => {
    const valeurs = (row.values as ExcelJS.CellValue[]).slice(1);
    lignes.push(valeurs.map(convertirCelluleEnTexte));
  });

  return lignes;
}

export async function parserFichier(
  cheminCompletDuFichier: string,
  nomDuFichier: string,
): Promise<string[][]> {
  const extension = path.extname(nomDuFichier).toLowerCase();

  if (extension === ".csv") {
    const contenu = fs.readFileSync(cheminCompletDuFichier, "utf-8");
    return parse(contenu, {
      columns: false,
      skipEmptyLines: true,
      trim: true,
    }) as string[][];
  }

  if (extension === ".xlsx") {
    return parserXlsx(cheminCompletDuFichier);
  }

  throw new Error(`Format de fichier non supporté : ${extension}`);
}
