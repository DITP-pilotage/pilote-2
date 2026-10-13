import {
  FichierTabulaireIllisibleError,
  readZipEntries,
} from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/tabular-file/readZip";

const FEUILLE = "xl/worksheets/sheet1.xml";
const CHAINES_PARTAGEES = "xl/sharedStrings.xml";
const PROPRIETES = "docProps/app.xml";
const STYLES = "xl/styles.xml";
const CLASSEUR = "xl/workbook.xml";

/**
 * Dernier numéro de ligne du format XLSX. Le nombre de lignes rendues suit le
 * plus grand numéro déclaré, pas le nombre de balises `<row>` : sans ce
 * plafond, une feuille de quelques centaines d'octets déclarant
 * `r="100000000"` fait allouer plusieurs gigaoctets et emporte le process.
 */
const NUMERO_DE_LIGNE_MAX = 1_048_576;

/** Dernier index de colonne (XFD, 0-based) : même raison, par ligne cette fois. */
const INDEX_DE_COLONNE_MAX = 16_383;

/** Formats intégrés de date (ECMA-376, §18.8.30). */
const FORMATS_DATE_INTEGRES = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22]);

const MS_PAR_JOUR = 86_400_000;

export type LectureXlsx = { lignes: string[][]; producteur: string | null };

const ENTITES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

function decoder(texte: string): string {
  return texte
    .replace(/&(amp|lt|gt|quot|apos);/g, (entite) => ENTITES[entite])
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

/** Concatène le texte de tous les <t> d'un fragment : gère aussi le rich text. */
function texteDesBalisesT(fragment: string): string {
  const morceaux = fragment.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? [];
  return morceaux
    .map((balise) =>
      decoder(balise.replace(/^<t[^>]*>/, "").replace(/<\/t>$/, "")),
    )
    .join("");
}

function lireChainesPartagees(xml: string): string[] {
  const items = xml.match(/<si\b[^>]*>[\s\S]*?<\/si>|<si\b[^>]*\/>/g) ?? [];
  return items.map(texteDesBalisesT);
}

function attribut(balise: string, nom: string): string | undefined {
  return balise.match(new RegExp(`\\b${nom}="([^"]*)"`))?.[1];
}

/**
 * Un format est une date s'il contient un jeton j, m ou a (d, m, y) hors des
 * littéraux : texte entre guillemets, caractère échappé, `[Red]`, `[$-40C]`…
 */
function estFormatDeDate(code: string): boolean {
  const jetons = code
    .replace(/"[^"]*"/g, "")
    .replace(/[\\_*]./g, "")
    .replace(/\[[^\]]*\]/g, "");
  return /[dmy]/i.test(jetons);
}

/** Pour chaque style de cellule (index de `cellXfs`), est-ce une date ? */
function lireStylesDeDate(xml: string): boolean[] {
  const formatsDeDate = new Set<number>(FORMATS_DATE_INTEGRES);
  for (const numFmt of xml.match(/<numFmt\b[^>]*>/g) ?? []) {
    const code = attribut(numFmt, "formatCode");
    if (code !== undefined && estFormatDeDate(decoder(code))) {
      formatsDeDate.add(Number(attribut(numFmt, "numFmtId")));
    }
  }

  const cellXfs = xml.match(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/)?.[1] ?? "";
  return (cellXfs.match(/<xf\b[^>]*>/g) ?? []).map((xf) =>
    formatsDeDate.has(Number(attribut(xf, "numFmtId") ?? 0)),
  );
}

/**
 * Une date Excel est un nombre de jours depuis l'origine du classeur ; seule
 * la partie entière compte, la partie décimale est l'heure.
 */
function dateDepuisNumeroDeSerie(
  serie: number,
  date1904: boolean,
): string | null {
  const origine = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);
  const date = new Date(origine + Math.floor(serie) * MS_PAR_JOUR);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

/** "C5" -> 2 (index de colonne, 0-based). */
function indexColonne(reference: string): number {
  const lettres = reference.replace(/\d+$/, "");
  let index = 0;
  for (const lettre of lettres) {
    index = index * 26 + (lettre.charCodeAt(0) - 64);
  }
  return index - 1;
}

export function readXlsx(archive: Buffer): LectureXlsx {
  const entrees = readZipEntries(archive, [
    FEUILLE,
    CHAINES_PARTAGEES,
    PROPRIETES,
    STYLES,
    CLASSEUR,
  ]);

  const feuille = entrees.get(FEUILLE);
  if (!feuille) {
    throw new FichierTabulaireIllisibleError(
      "feuille-introuvable",
      "Le classeur ne contient pas de feuille lisible. Enregistrez-le au format .xlsx standard.",
    );
  }

  const chaines = entrees.has(CHAINES_PARTAGEES)
    ? lireChainesPartagees(entrees.get(CHAINES_PARTAGEES)!.toString("utf-8"))
    : [];

  const stylesDeDate = lireStylesDeDate(
    entrees.get(STYLES)?.toString("utf-8") ?? "",
  );
  const date1904 = /<workbookPr\b[^>]*\bdate1904="(1|true)"/.test(
    entrees.get(CLASSEUR)?.toString("utf-8") ?? "",
  );

  const producteur =
    entrees
      .get(PROPRIETES)
      ?.toString("utf-8")
      .match(/<Application>([\s\S]*?)<\/Application>/)?.[1] ?? null;

  const xml = feuille.toString("utf-8");
  const parLigne = new Map<number, Map<number, string>>();
  let ligneMax = 0;

  const balisesLigne =
    xml.match(/<row\b[^>]*>[\s\S]*?<\/row>|<row\b[^>]*\/>/g) ?? [];

  for (const balise of balisesLigne) {
    // Le numéro vient de l'attribut `r`, jamais d'un compteur : une ligne vide
    // au milieu du fichier ne doit décaler aucune des suivantes.
    const numeroLigne = Number(balise.match(/\br="(\d+)"/)?.[1] ?? 0);
    if (numeroLigne === 0) continue;
    if (numeroLigne > NUMERO_DE_LIGNE_MAX) {
      throw new FichierTabulaireIllisibleError(
        "trop-de-lignes",
        "Le classeur déclare trop de lignes pour le format .xlsx. Réenregistrez-le depuis votre tableur.",
      );
    }
    ligneMax = Math.max(ligneMax, numeroLigne);

    const cellules = new Map<number, string>();
    const balisesCellule =
      balise.match(/<c\b[^>]*>[\s\S]*?<\/c>|<c\b[^>]*\/>/g) ?? [];

    for (const cellule of balisesCellule) {
      // La position vient de `r` (ex. "C5") : une cellule vide intercalée,
      // absente du XML, ne doit pas décaler les colonnes suivantes.
      const reference = cellule.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!reference) continue;
      const colonne = indexColonne(reference);
      if (colonne > INDEX_DE_COLONNE_MAX) {
        throw new FichierTabulaireIllisibleError(
          "trop-de-colonnes",
          "Le classeur déclare trop de colonnes pour le format .xlsx. Réenregistrez-le depuis votre tableur.",
        );
      }

      const type = cellule.match(/\bt="([^"]+)"/)?.[1] ?? "n";
      let valeur = "";

      if (type === "inlineStr") {
        valeur = texteDesBalisesT(cellule);
      } else {
        const brut = cellule.match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1];
        if (brut !== undefined) {
          // `s` : index dans sharedStrings. `str` : valeur en cache d'une
          // formule — sans ce cas on obtient "[object Object]" (PLTT-330).
          // Un nombre au format date est rendu en AAAA-MM-JJ (PIL-1888). Tout
          // le reste est rendu tel quel : ni Number(), ni Date, qui
          // décaleraient les nombres.
          const ouvrante = cellule.match(/^<c\b[^>]*>/)?.[0] ?? "";
          const date =
            type === "n" &&
            stylesDeDate[Number(attribut(ouvrante, "s") ?? 0)] === true
              ? dateDepuisNumeroDeSerie(Number(brut), date1904)
              : null;
          if (type === "s") {
            valeur = chaines[Number(brut)] ?? "";
          } else {
            valeur = date ?? decoder(brut);
          }
        }
      }

      if (valeur !== "") cellules.set(colonne, valeur);
    }

    parLigne.set(numeroLigne, cellules);
  }

  const lignes: string[][] = [];

  for (let numero = 1; numero <= ligneMax; numero += 1) {
    const cellules = parLigne.get(numero) ?? new Map<number, string>();
    // Chaque ligne s'arrête à sa propre dernière cellule renseignée. C'est ce
    // qui permet ensuite de distinguer une cellule vide d'une cellule absente,
    // et donc de détecter une ligne plus courte que le schéma.
    const derniereColonne = Math.max(-1, ...cellules.keys());
    lignes.push(
      Array.from(
        { length: derniereColonne + 1 },
        (_, colonne) => cellules.get(colonne) ?? "",
      ),
    );
  }

  return { lignes, producteur };
}
