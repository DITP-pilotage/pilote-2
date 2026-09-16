import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateRawSync } from "node:zlib";

const ICI = dirname(fileURLToPath(import.meta.url));
const DOSSIER = join(
  ICI,
  "../../src/server/infrastructure/fichier-tabulaire/__fixtures__",
);

const ENTETE_STANDARD = [
  "identifiant_indic",
  "zone_id",
  "zone_nom",
  "date_valeur",
  "type_valeur",
  "valeur",
];

/** Construit un .xlsx minimal (un onglet, chaines inline) sans aucune dependance. */
function construireXlsx(lignes) {
  const cellule = (colonneIndex, ligneIndex, valeur) => {
    const colonne = String.fromCharCode(65 + colonneIndex);
    if (valeur === null || valeur === undefined || valeur === "") return "";
    return `<c r="${colonne}${ligneIndex}" t="inlineStr"><is><t xml:space="preserve">${valeur
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")}</t></is></c>`;
  };

  const rows = lignes
    .map((ligne, i) => {
      const numero = i + 1;
      const cells = ligne.map((v, j) => cellule(j, numero, v)).join("");
      return `<row r="${numero}">${cells}</row>`;
    })
    .join("");

  const sheet =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetData>${rows}</sheetData></worksheet>`;

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `</Types>`;

  const rels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;

  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<sheets><sheet name="Feuille1" sheetId="1" r:id="rId1"/></sheets></workbook>`;

  const workbookRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `</Relationships>`;

  return ecrireZip([
    ["[Content_Types].xml", contentTypes],
    ["_rels/.rels", rels],
    ["xl/workbook.xml", workbook],
    ["xl/_rels/workbook.xml.rels", workbookRels],
    ["xl/worksheets/sheet1.xml", sheet],
  ]);
}

/** Ecrit un zip deflate minimal : en-tetes locaux + central directory + EOCD. */
function ecrireZip(entrees) {
  const morceaux = [];
  const central = [];
  let offset = 0;

  for (const [nom, contenu] of entrees) {
    const brut = Buffer.from(contenu, "utf-8");
    const compresse = deflateRawSync(brut);
    const nomBuf = Buffer.from(nom, "utf-8");
    const crc = crc32(brut);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(0, 10);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compresse.length, 18);
    local.writeUInt32LE(brut.length, 22);
    local.writeUInt16LE(nomBuf.length, 26);
    local.writeUInt16LE(0, 28);

    morceaux.push(local, nomBuf, compresse);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt32LE(0, 12);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(compresse.length, 20);
    cd.writeUInt32LE(brut.length, 24);
    cd.writeUInt16LE(nomBuf.length, 28);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nomBuf);

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

function csv(
  lignes,
  { delimiteur = ";", finDeLigne = "\r\n", encodage = "utf-8", bom = false } = {},
) {
  const texte =
    lignes.map((l) => l.join(delimiteur)).join(finDeLigne) + finDeLigne;
  const corps = Buffer.from(texte, encodage === "cp1252" ? "latin1" : "utf-8");
  return bom ? Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), corps]) : corps;
}

const L_OK_1 = ["IND-001", "D46", "Lot", "2023-01-31", "vi", "12.5"];
const L_OK_2 = ["IND-002", "R84", "ARA", "2023-02-28", "va", "7"];

const CAS = {
  "valide-pointvirgule": csv([ENTETE_STANDARD, L_OK_1, L_OK_2]),
  "valide-virgule": csv([ENTETE_STANDARD, L_OK_1, L_OK_2], { delimiteur: "," }),
  "valide-lf": csv([ENTETE_STANDARD, L_OK_1], { finDeLigne: "\n" }),
  "valide-bom": csv([ENTETE_STANDARD, L_OK_1], { bom: true }),
  "valide-cp1252": csv(
    [ENTETE_STANDARD, ["IND-001", "D46", "Rhône-Alpes", "2023-01-31", "vi", "1"]],
    { encodage: "cp1252" },
  ),
  vide: Buffer.from(""),

  "colonne-schema-absente": csv([
    ["identifiant_indic", "zone_id", "date_valeur", "type_valeur"],
    ["IND-001", "D46", "2023-01-31", "vi"],
  ]),
  "colonne-surnumeraire": csv([
    [...ENTETE_STANDARD, "colonne_inconnue"],
    [...L_OK_1, "peu importe"],
  ]),

  "pattern-identifiant": csv([
    ENTETE_STANDARD,
    ["IND-XXX", "D46", "Lot", "2023-01-31", "vi", "1"],
  ]),
  "pattern-zone": csv([
    ENTETE_STANDARD,
    ["IND-001", "ZZZ", "Lot", "2023-01-31", "vi", "1"],
  ]),
  "pattern-date": csv([
    ENTETE_STANDARD,
    ["IND-001", "D46", "Lot", "pas-une-date", "vi", "1"],
  ]),
  "enum-type-valeur": csv([
    ENTETE_STANDARD,
    ["IND-001", "D46", "Lot", "2023-01-31", "zz", "1"],
  ]),
  "required-identifiant": csv([
    ENTETE_STANDARD,
    ["", "D46", "Lot", "2023-01-31", "vi", "1"],
  ]),
  "type-valeur-non-numerique": csv([
    ENTETE_STANDARD,
    ["IND-001", "D46", "Lot", "2023-01-31", "vi", "abc"],
  ]),
  "nombre-virgule-decimale": csv([
    ENTETE_STANDARD,
    ["IND-001", "D46", "Lot", "2023-01-31", "vi", "12,5"],
  ]),
  "nombre-notation-scientifique": csv([
    ENTETE_STANDARD,
    ["IND-001", "D46", "Lot", "2023-01-31", "vi", "1e5"],
  ]),
  "nombre-signe-plus": csv([
    ENTETE_STANDARD,
    ["IND-001", "D46", "Lot", "2023-01-31", "vi", "+5"],
  ]),
  "nombre-espaces": csv([
    ENTETE_STANDARD,
    ["IND-001", "D46", "Lot", "2023-01-31", "vi", " 5 "],
  ]),
  "nombre-negatif": csv([
    ENTETE_STANDARD,
    ["IND-001", "D46", "Lot", "2023-01-31", "vi", "-3"],
  ]),
  "nombre-au-dela-de-cent": csv([
    ENTETE_STANDARD,
    ["IND-001", "D46", "Lot", "2023-01-31", "vi", "150"],
  ]),

  "doublon-cle-primaire": csv([ENTETE_STANDARD, L_OK_1, L_OK_1]),
  "ligne-vide-fin": csv([ENTETE_STANDARD, L_OK_1, ["", "", "", "", "", ""]]),
  "ligne-vide-milieu": csv([
    ENTETE_STANDARD,
    L_OK_1,
    ["", "", "", "", "", ""],
    L_OK_2,
  ]),

  "entete-identifiant-absent": csv([
    ["zone_id", "date_valeur", "type_valeur", "valeur"],
    ["D46", "2023-01-31", "vi", "1"],
  ]),
  "entete-espace": csv([
    [" identifiant_indic", ...ENTETE_STANDARD.slice(1)],
    L_OK_1,
  ]),
  "entete-majuscule": csv([
    ["IDENTIFIANT_INDIC", ...ENTETE_STANDARD.slice(1)],
    L_OK_1,
  ]),
  "entete-doublon": csv([[...ENTETE_STANDARD, "valeur"], [...L_OK_1, "2"]]),

  "beaucoup-d-erreurs": csv([
    ENTETE_STANDARD,
    ...Array.from({ length: 2000 }, (_, i) => [
      `MAUVAIS-${i}`,
      "ZZZ",
      "x",
      "pas-une-date",
      "zz",
      "abc",
    ]),
  ]),
};

const CAS_XLSX = {
  "xlsx-valide": construireXlsx([ENTETE_STANDARD, L_OK_1, L_OK_2]),
  "xlsx-ligne-vide-milieu": construireXlsx([
    ENTETE_STANDARD,
    L_OK_1,
    ["", "", "", "", "", ""],
    L_OK_2,
  ]),
  "xlsx-cellules-vides-intercalees": construireXlsx([
    ENTETE_STANDARD,
    ["IND-001", "D46", "", "2023-01-31", "vi", ""],
  ]),
  "xlsx-pattern-identifiant": construireXlsx([
    ENTETE_STANDARD,
    ["IND-XXX", "D46", "Lot", "2023-01-31", "vi", "1"],
  ]),
};

mkdirSync(DOSSIER, { recursive: true });
for (const [nom, contenu] of Object.entries(CAS)) {
  writeFileSync(join(DOSSIER, `${nom}.csv`), contenu);
}
for (const [nom, contenu] of Object.entries(CAS_XLSX)) {
  writeFileSync(join(DOSSIER, `${nom}.xlsx`), contenu);
}
console.log(
  `${Object.keys(CAS).length} fixtures CSV + ${Object.keys(CAS_XLSX).length} fixtures XLSX ecrites`,
);
