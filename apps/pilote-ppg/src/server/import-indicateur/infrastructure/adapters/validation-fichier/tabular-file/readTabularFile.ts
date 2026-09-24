import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { readCsv } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/tabular-file/readCsv";
import { readXlsx } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/tabular-file/readXlsx";
import { FichierTabulaireIllisibleError } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/tabular-file/readZip";

export type FichierTabulaire = {
  entetes: string[];
  /** Lignes de données, en-tête exclue. Une ligne peut être plus courte que l'en-tête. */
  lignes: string[][];
  /** Numéro de ligne tel que l'utilisateur le voit : en-tête = 1, 1re donnée = 2. */
  numerosDeLigneSource: number[];
  producteur: string | null;
};

export async function readTabularFile(
  chemin: string,
  nom: string,
): Promise<FichierTabulaire> {
  const extension = extname(nom).toLowerCase();
  const contenu = await readFile(chemin);

  let brutes: string[][];
  let producteur: string | null = null;

  if (extension === ".csv") {
    brutes = readCsv(contenu);
  } else if (extension === ".xlsx") {
    const lecture = readXlsx(contenu);
    brutes = lecture.lignes;
    producteur = lecture.producteur;
  } else {
    throw new FichierTabulaireIllisibleError(
      "extension-non-supportee",
      `Le format « ${extension || "inconnu"} » n'est pas pris en charge. Importez un fichier .csv ou .xlsx.`,
    );
  }

  if (brutes.length === 0) {
    throw new FichierTabulaireIllisibleError(
      "fichier-vide",
      "Le fichier est vide.",
    );
  }

  const [entetes, ...lignes] = brutes;

  return {
    entetes,
    lignes,
    numerosDeLigneSource: lignes.map((_, index) => index + 2),
    producteur,
  };
}
