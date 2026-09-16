import { parse } from "csv-parse/sync";

const BOM_UTF8 = Buffer.from([0xef, 0xbb, 0xbf]);
const DELIMITEURS_CANDIDATS = [";", ",", "\t"] as const;

/**
 * Un contenu est considéré comme UTF-8 s'il se décode sans produire de
 * caractère de remplacement. Sinon on retombe sur cp1252, que produit Excel en
 * français. Validata fait de même : une fixture cp1252 y est lue correctement
 * (mesuré le 2026-09-16).
 */
function decoderTexte(contenu: Buffer): string {
  const sansBom = contenu.subarray(0, 3).equals(BOM_UTF8)
    ? contenu.subarray(3)
    : contenu;

  const enUtf8 = new TextDecoder("utf-8").decode(sansBom);
  if (!enUtf8.includes("�")) {
    return enUtf8;
  }
  return new TextDecoder("windows-1252").decode(sansBom);
}

/**
 * Retient le délimiteur qui découpe la première ligne en le plus de colonnes.
 * Indispensable : le template officiel distribué aux utilisateurs est séparé
 * par des points-virgules, tandis que le CSV généré par l'API publique l'est
 * par des virgules.
 */
function detecterDelimiteur(texte: string): string {
  const premiereLigne = texte.split(/\r?\n/, 1)[0] ?? "";
  let meilleur: string = DELIMITEURS_CANDIDATS[0];
  let meilleurCompte = -1;

  for (const candidat of DELIMITEURS_CANDIDATS) {
    const compte = premiereLigne.split(candidat).length;
    if (compte > meilleurCompte) {
      meilleurCompte = compte;
      meilleur = candidat;
    }
  }
  return meilleur;
}

export function lireCsv(contenu: Buffer): string[][] {
  const texte = decoderTexte(contenu);

  return parse(texte, {
    columns: false,
    delimiter: detecterDelimiteur(texte),
    // Les lignes vides sont conservées : Validata les signale (`blank-row`) et
    // elles doivent garder leur numéro de ligne.
    skip_empty_lines: false,
    relax_column_count: true,
    relax_quotes: true,
    trim: true,
  }) as string[][];
}
