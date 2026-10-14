import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { crc32, deflateRawSync } from "node:zlib";

/**
 * Construit en mémoire les fichiers dont les tests ont besoin. L'encodage, les
 * fins de ligne et le BOM font partie des cas testés : ils sont donc produits
 * octet par octet, plutôt que commités, où Git les normaliserait.
 */

type OptionsCsv = {
  delimiteur?: string;
  finDeLigne?: string;
  encodage?: "utf-8" | "cp1252";
  bom?: boolean;
};

const BOM_UTF8 = Buffer.from([0xef, 0xbb, 0xbf]);

export function construireCsv(
  lignes: string[][],
  {
    delimiteur = ";",
    finDeLigne = "\r\n",
    encodage = "utf-8",
    bom = false,
  }: OptionsCsv = {},
): Buffer {
  const texte =
    lignes.map((ligne) => ligne.join(delimiteur)).join(finDeLigne) + finDeLigne;
  const corps = Buffer.from(texte, encodage === "cp1252" ? "latin1" : "utf-8");
  return bom ? Buffer.concat([BOM_UTF8, corps]) : corps;
}

const echapper = (valeur: string) =>
  valeur.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** 0 -> "A", 25 -> "Z", 26 -> "AA". */
function lettresColonne(index: number): string {
  let lettres = "";
  for (let reste = index + 1; reste > 0; reste = Math.floor((reste - 1) / 26)) {
    lettres = String.fromCharCode(65 + ((reste - 1) % 26)) + lettres;
  }
  return lettres;
}

/**
 * Cellule saisie comme une date dans le tableur : Excel l'enregistre comme un
 * nombre de jours depuis son origine, et seul le style la rend lisible.
 */
export type CelluleDate = { date: string };

/** Cellule numérique au format « Standard », sans style. */
export type CelluleNombre = { nombre: string };

type CelluleXlsx = string | CelluleDate | CelluleNombre;

type OptionsXlsx = {
  /** Identifiant de format intégré, ou code d'un format personnalisé. */
  formatDate?: number | string;
  date1904?: boolean;
};

const STYLE_DATE = 1;
const ID_FORMAT_PERSONNALISE = 164;
const MS_PAR_JOUR = 86_400_000;

function serieExcel(dateIso: string, date1904: boolean): number {
  const origine = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);
  return (Date.parse(`${dateIso}T00:00:00Z`) - origine) / MS_PAR_JOUR;
}

function celluleXml(
  reference: string,
  valeur: CelluleXlsx,
  date1904: boolean,
): string {
  if (typeof valeur === "string") {
    return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${echapper(valeur)}</t></is></c>`;
  }
  if ("nombre" in valeur) {
    return `<c r="${reference}"><v>${valeur.nombre}</v></c>`;
  }
  return `<c r="${reference}" s="${STYLE_DATE}"><v>${serieExcel(valeur.date, date1904)}</v></c>`;
}

function stylesXml(formatDate: number | string): string {
  const personnalise = typeof formatDate === "string";
  const idFormat = personnalise ? ID_FORMAT_PERSONNALISE : formatDate;
  const numFmts = personnalise
    ? `<numFmts count="1"><numFmt numFmtId="${ID_FORMAT_PERSONNALISE}" formatCode="${echapper(formatDate).replace(/"/g, "&quot;")}"/></numFmts>`
    : "";

  // Index 1 de cellXfs = STYLE_DATE.
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    numFmts +
    `<fonts count="1"><font/></fonts><fills count="1"><fill/></fills>` +
    `<borders count="1"><border/></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0"/></cellStyleXfs>` +
    `<cellXfs count="2"><xf numFmtId="0" xfId="0"/>` +
    `<xf numFmtId="${idFormat}" xfId="0" applyNumberFormat="1"/></cellXfs>` +
    `</styleSheet>`
  );
}

/** Classeur .xlsx minimal : un onglet, chaînes inline, cellules vides omises. */
export function construireXlsx(
  lignes: CelluleXlsx[][],
  options: OptionsXlsx = {},
): Buffer {
  return construireXlsxNumerote(
    lignes.map((ligne, index) => [index + 1, ligne]),
    options,
  );
}

/**
 * Même classeur, mais le numéro de ligne est choisi par l'appelant : c'est
 * l'attribut `r` du XML, et non la position de la balise, qui fait foi à la
 * lecture.
 */
export function construireXlsxNumerote(
  lignes: [numero: number, cellules: CelluleXlsx[]][],
  { formatDate = 14, date1904 = false }: OptionsXlsx = {},
): Buffer {
  const rows = lignes
    .map(([numero, ligne]) => {
      const cellules = ligne
        .map((valeur, colonne) =>
          valeur === ""
            ? ""
            : celluleXml(
                `${lettresColonne(colonne)}${numero}`,
                valeur,
                date1904,
              ),
        )
        .join("");
      return `<row r="${numero}">${cellules}</row>`;
    })
    .join("");
  // Feuille de styles seulement si utile : certains tests plafonnent la taille
  // du classeur produit.
  const avecStyles = lignes.some(([, ligne]) =>
    ligne.some((valeur) => typeof valeur !== "string" && "date" in valeur),
  );

  return ecrireZip([
    [
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        (avecStyles
          ? `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`
          : "") +
        `</Types>`,
    ],
    [
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`,
    ],
    [
      "xl/workbook.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
        `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        (date1904 ? `<workbookPr date1904="1"/>` : "") +
        `<sheets><sheet name="Feuille1" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ],
    [
      "xl/_rels/workbook.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
        (avecStyles
          ? `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
          : "") +
        `</Relationships>`,
    ],
    ...(avecStyles
      ? [["xl/styles.xml", stylesXml(formatDate)] satisfies [string, string]]
      : []),
    [
      "xl/worksheets/sheet1.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
        `<sheetData>${rows}</sheetData></worksheet>`,
    ],
  ]);
}

/** Zip deflate minimal : en-têtes locaux, central directory, EOCD. */
function ecrireZip(entrees: [string, string][]): Buffer {
  const morceaux: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const [nom, contenu] of entrees) {
    const brut = Buffer.from(contenu, "utf-8");
    const compresse = deflateRawSync(brut);
    const nomBuf = Buffer.from(nom, "utf-8");
    const controle = crc32(brut);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(controle, 14);
    local.writeUInt32LE(compresse.length, 18);
    local.writeUInt32LE(brut.length, 22);
    local.writeUInt16LE(nomBuf.length, 26);
    morceaux.push(local, nomBuf, compresse);

    const entree = Buffer.alloc(46);
    entree.writeUInt32LE(0x02014b50, 0);
    entree.writeUInt16LE(20, 4);
    entree.writeUInt16LE(20, 6);
    entree.writeUInt16LE(8, 10);
    entree.writeUInt32LE(controle, 16);
    entree.writeUInt32LE(compresse.length, 20);
    entree.writeUInt32LE(brut.length, 24);
    entree.writeUInt16LE(nomBuf.length, 28);
    entree.writeUInt32LE(offset, 42);
    central.push(entree, nomBuf);

    offset += local.length + nomBuf.length + compresse.length;
  }

  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entrees.length, 8);
  eocd.writeUInt16LE(entrees.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);

  return Buffer.concat([...morceaux, centralBuf, eocd]);
}

/** Écrit un contenu dans un fichier temporaire et renvoie son chemin. */
export function deposerDansUnFichierTemporaire(
  nom: string,
  contenu: Buffer,
): string {
  const chemin = join(mkdtempSync(join(tmpdir(), "tabular-file-")), nom);
  writeFileSync(chemin, contenu);
  return chemin;
}
