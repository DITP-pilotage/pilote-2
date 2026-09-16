import { copyFileSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalFichierIndicateurValidationService } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/LocalFichierIndicateurValidationService";

const BASE = join(__dirname, "../../../../infrastructure/fichier-tabulaire");
const FIXTURES = join(BASE, "__fixtures__");
const GOLDENS = join(BASE, "__goldens__");

type Golden = {
  erreurHttp?: number;
  valid: boolean;
  errors: {
    type: string;
    rowNumber: number | null;
    fieldName: string | null;
  }[];
};

/**
 * Les contrôles d'en-tête de l'application (espaces, majuscules, doublons) ne
 * sont pas émis par Validata : ils lui préexistent et sont portés à la ligne 1.
 * La parité porte donc sur les violations de contenu, qui pilotent l'import.
 */
const ligneDeContenu = (numeroDeLigne: number) => numeroDeLigne > 1;

const cas = readdirSync(GOLDENS)
  .filter((nom) => nom.endsWith(".golden.json"))
  .sort();

describe("parité de verdict avec Validata", () => {
  it.each(cas)("%s", async (nomGolden) => {
    const golden = JSON.parse(
      readFileSync(join(GOLDENS, nomGolden), "utf-8"),
    ) as Golden;

    const sansSuffixe = nomGolden.replace(".golden.json", "");
    const separateur = sansSuffixe.lastIndexOf(".");
    const nomFixture = sansSuffixe.slice(0, separateur);
    const schema = `${sansSuffixe.slice(separateur + 1)}.json`;

    // L'adapter supprime le fichier après lecture : on travaille sur une copie.
    const copie = join(tmpdir(), `parite-${process.pid}-${nomGolden}`);
    copyFileSync(join(FIXTURES, nomFixture), copie);

    const rapport =
      await new LocalFichierIndicateurValidationService().validerFichier({
        cheminCompletDuFichier: copie,
        nomDuFichier: nomFixture,
        schema,
        utilisateurEmail: "parite@example.com",
      });

    // Validata refuse le fichier au niveau HTTP : on doit le refuser aussi.
    if (golden.erreurHttp) {
      expect(rapport.estValide).toBe(false);
      return;
    }

    const attenduDeContenu = golden.errors
      .filter((erreur) => erreur.rowNumber !== null)
      .map((erreur) => `${erreur.rowNumber}:${erreur.fieldName ?? "-"}`)
      .sort();

    const obtenuDeContenu = rapport.listeErreursValidation
      .filter((erreur) => ligneDeContenu(erreur.numeroDeLigne))
      .map((erreur) => `${erreur.numeroDeLigne}:${erreur.nomDuChamp || "-"}`)
      .sort();

    expect([...new Set(obtenuDeContenu)]).toEqual([
      ...new Set(attenduDeContenu),
    ]);

    // Une erreur structurelle de Validata (en-têtes) doit nous rendre invalides
    // aussi, même si nous la formulons différemment.
    const attenduDeStructure = golden.errors.filter(
      (erreur) => erreur.rowNumber === null,
    );
    if (attenduDeStructure.length > 0) {
      expect(rapport.estValide).toBe(false);
    }

    // Validata valide le fichier : aucune violation de contenu de notre côté.
    if (golden.valid) {
      expect(obtenuDeContenu).toEqual([]);
    }
  });
});
