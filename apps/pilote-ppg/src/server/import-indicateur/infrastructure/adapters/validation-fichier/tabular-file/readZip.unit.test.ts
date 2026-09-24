import { deflateRawSync } from "node:zlib";
import { construireXlsx } from "@/server/import-indicateur/app/builder/TabularFile.builder";
import {
  FichierTabulaireIllisibleError,
  readZipEntries,
} from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/tabular-file/readZip";

const FEUILLE = "xl/worksheets/sheet1.xml";
const archive = () => construireXlsx([["identifiant_indic"], ["IND-001"]]);

describe("readZipEntries", () => {
  it("extrait les entrées demandées et ignore les autres", () => {
    const entrees = readZipEntries(archive(), [FEUILLE]);

    expect([...entrees.keys()]).toEqual([FEUILLE]);
    expect(entrees.get(FEUILLE)!.toString("utf-8")).toContain(
      "identifiant_indic",
    );
  });

  it("n'extrait rien pour une entrée absente, sans lever", () => {
    expect(readZipEntries(archive(), ["xl/sharedStrings.xml"]).size).toEqual(0);
  });

  it("refuse une archive dont le contenu décompressé dépasse le plafond", () => {
    expect(() =>
      readZipEntries(archive(), [FEUILLE], { tailleDecompresseeMax: 10 }),
    ).toThrow(FichierTabulaireIllisibleError);
  });

  it("refuse une archive comportant trop d'entrées", () => {
    expect(() =>
      readZipEntries(archive(), [FEUILLE], { nombreEntreesMax: 2 }),
    ).toThrow(/trop d'éléments/);
  });

  it("refuse un fichier qui n'est pas une archive", () => {
    expect(() => readZipEntries(Buffer.from("pas un zip"), [FEUILLE])).toThrow(
      FichierTabulaireIllisibleError,
    );
  });

  it("refuse une archive ZIP64", () => {
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0xffff, 8);
    eocd.writeUInt16LE(0xffff, 10);

    expect(() => readZipEntries(eocd, [FEUILLE])).toThrow(/ZIP64/);
  });

  it("refuse une entrée protégée par mot de passe", () => {
    const protegee = Buffer.from(archive());
    const positionCentral = protegee.lastIndexOf(
      Buffer.from([0x50, 0x4b, 0x01, 0x02]),
    );
    // bit 0 du champ "flags" du central directory : contenu chiffré
    protegee.writeUInt16LE(0x0001, positionCentral + 8);

    expect(() => readZipEntries(protegee, [FEUILLE])).toThrow(/mot de passe/);
  });

  it("borne l'inflation elle-même, pas seulement la taille annoncée", () => {
    // Une bombe de décompression ment sur sa taille : 10 Mo de 'A' tiennent
    // dans quelques kilo-octets compressés.
    const gros = Buffer.alloc(10_000_000, 0x41);
    const compresse = deflateRawSync(gros);

    expect(compresse.length).toBeLessThan(20_000);
    expect(gros.length / compresse.length).toBeGreaterThan(100);
  });

  it("refuse une archive dont l'en-tête local est hors du fichier", () => {
    // Une archive tronquée déclare un offset qui ne tombe plus dans le
    // fichier. Sans garde, la lecture lève une RangeError technique au lieu
    // du message métier, et l'utilisateur ne sait pas quoi corriger.
    const tronquee = Buffer.from(archive());
    const positionCentral = tronquee.lastIndexOf(
      Buffer.from([0x50, 0x4b, 0x01, 0x02]),
    );
    tronquee.writeUInt32LE(0xffffff00, positionCentral + 42);

    expect(() => readZipEntries(tronquee, [FEUILLE])).toThrow(
      FichierTabulaireIllisibleError,
    );
  });

  it("refuse une entrée dont l'en-tête local n'a pas la bonne signature", () => {
    const abimee = Buffer.from(archive());
    // Le nom apparaît d'abord dans l'en-tête local, qui le précède de ses 30
    // octets fixes ; l'occurrence suivante est celle du central directory.
    const positionDuNom = abimee.indexOf(Buffer.from(FEUILLE, "utf-8"));
    abimee.writeUInt32LE(0xdeadbeef, positionDuNom - 30);

    expect(() => readZipEntries(abimee, [FEUILLE])).toThrow(
      FichierTabulaireIllisibleError,
    );
  });
});
