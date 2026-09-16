import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { lireCsv } from "@/server/infrastructure/fichier-tabulaire/lireCsv";
import { lireXlsx } from "@/server/infrastructure/fichier-tabulaire/lireXlsx";
import { FichierTabulaireIllisibleError } from "@/server/infrastructure/fichier-tabulaire/lireZip";

export type FichierTabulaire = {
  entetes: string[];
  /** Lignes de données, en-tête exclue. Une ligne peut être plus courte que l'en-tête. */
  lignes: string[][];
  /** Numéro de ligne tel que l'utilisateur le voit : en-tête = 1, 1re donnée = 2. */
  numerosDeLigneSource: number[];
  producteur: string | null;
};

export async function lireFichierTabulaire(
  chemin: string,
  nom: string,
): Promise<FichierTabulaire> {
  const extension = extname(nom).toLowerCase();
  const contenu = await readFile(chemin);

  let brutes: string[][];
  let producteur: string | null = null;

  if (extension === ".csv") {
    brutes = lireCsv(contenu);
  } else if (extension === ".xlsx") {
    const lecture = lireXlsx(contenu);
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
