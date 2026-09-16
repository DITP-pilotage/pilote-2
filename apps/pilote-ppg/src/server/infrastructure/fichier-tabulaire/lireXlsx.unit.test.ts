import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lireXlsx } from "@/server/infrastructure/fichier-tabulaire/lireXlsx";

const fixture = (nom: string) =>
  readFileSync(join(__dirname, "__fixtures__", nom));

describe("lireXlsx", () => {
  it("lit les en-têtes et les lignes de données", () => {
    const { lignes } = lireXlsx(fixture("xlsx-valide.xlsx"));

    expect(lignes[0]).toEqual([
      "identifiant_indic",
      "zone_id",
      "zone_nom",
      "date_valeur",
      "type_valeur",
      "valeur",
    ]);
    expect(lignes[1]).toEqual([
      "IND-001",
      "D46",
      "Lot",
      "2023-01-31",
      "vi",
      "12.5",
    ]);
  });

  it("ne décale pas la numérotation quand une ligne vide est intercalée", () => {
    const { lignes } = lireXlsx(fixture("xlsx-ligne-vide-milieu.xlsx"));

    expect(lignes.slice(2)).toEqual([
      [],
      ["IND-002", "R84", "ARA", "2023-02-28", "va", "7"],
    ]);
  });

  it("ne décale pas les colonnes quand une cellule vide est intercalée", () => {
    const { lignes } = lireXlsx(
      fixture("xlsx-cellules-vides-intercalees.xlsx"),
    );

    // Golden Validata : ['IND-001','D46',None,'2023-01-31','vi'] — la cellule
    // intercalée est conservée à sa place, la cellule finale vide est tronquée.
    expect(lignes[1]).toEqual(["IND-001", "D46", "", "2023-01-31", "vi"]);
  });

  it("n'expose aucun producteur quand docProps/app.xml est absent", () => {
    expect(lireXlsx(fixture("xlsx-valide.xlsx")).producteur).toBeNull();
  });

  it("lit le template XLSX officiel distribué aux utilisateurs", () => {
    const officiel = readFileSync(
      join(__dirname, "../../../../public/model/template_import_PILOTE.xlsx"),
    );

    const { lignes, producteur } = lireXlsx(officiel);

    expect(lignes[0]).toEqual([
      "identifiant_indic",
      "zone_id",
      "zone_nom",
      "date_valeur",
      "type_valeur",
      "valeur",
    ]);
    expect(producteur).not.toBeNull();
  });
});
