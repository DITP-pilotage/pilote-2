import { deflateRawSync } from "node:zlib";
import { construireXlsx } from "@/server/infrastructure/fichier-tabulaire/fichierTabulaire.builder";
import {
  FichierTabulaireIllisibleError,
  lireEntreesZip,
} from "@/server/infrastructure/fichier-tabulaire/lireZip";

const FEUILLE = "xl/worksheets/sheet1.xml";
const archive = () => construireXlsx([["identifiant_indic"], ["IND-001"]]);

describe("lireEntreesZip", () => {
  it("extrait les entrées demandées et ignore les autres", () => {
    const entrees = lireEntreesZip(archive(), [FEUILLE]);

    expect([...entrees.keys()]).toEqual([FEUILLE]);
    expect(entrees.get(FEUILLE)!.toString("utf-8")).toContain(
      "identifiant_indic",
    );
  });

  it("n'extrait rien pour une entrée absente, sans lever", () => {
    expect(lireEntreesZip(archive(), ["xl/sharedStrings.xml"]).size).toEqual(0);
  });

  it("refuse une archive dont le contenu décompressé dépasse le plafond", () => {
    expect(() =>
      lireEntreesZip(archive(), [FEUILLE], { tailleDecompresseeMax: 10 }),
    ).toThrow(FichierTabulaireIllisibleError);
  });

  it("refuse une archive comportant trop d'entrées", () => {
    expect(() =>
      lireEntreesZip(archive(), [FEUILLE], { nombreEntreesMax: 2 }),
    ).toThrow(/trop d'éléments/);
  });

  it("refuse un fichier qui n'est pas une archive", () => {
    expect(() => lireEntreesZip(Buffer.from("pas un zip"), [FEUILLE])).toThrow(
      FichierTabulaireIllisibleError,
    );
  });

  it("refuse une archive ZIP64", () => {
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0xffff, 8);
    eocd.writeUInt16LE(0xffff, 10);

    expect(() => lireEntreesZip(eocd, [FEUILLE])).toThrow(/ZIP64/);
  });

  it("refuse une entrée protégée par mot de passe", () => {
    const protegee = Buffer.from(archive());
    const positionCentral = protegee.lastIndexOf(
      Buffer.from([0x50, 0x4b, 0x01, 0x02]),
    );
    // bit 0 du champ "flags" du central directory : contenu chiffré
    protegee.writeUInt16LE(0x0001, positionCentral + 8);

    expect(() => lireEntreesZip(protegee, [FEUILLE])).toThrow(/mot de passe/);
  });

  it("borne l'inflation elle-même, pas seulement la taille annoncée", () => {
    // Une bombe de décompression ment sur sa taille : 10 Mo de 'A' tiennent
    // dans quelques kilo-octets compressés.
    const gros = Buffer.alloc(10_000_000, 0x41);
    const compresse = deflateRawSync(gros);

    expect(compresse.length).toBeLessThan(20_000);
    expect(gros.length / compresse.length).toBeGreaterThan(100);
  });
});
