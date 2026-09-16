import { join } from "node:path";
import { lireFichierTabulaire } from "@/server/infrastructure/fichier-tabulaire/lireFichierTabulaire";
import { FichierTabulaireIllisibleError } from "@/server/infrastructure/fichier-tabulaire/lireZip";

const chemin = (nom: string) => join(__dirname, "__fixtures__", nom);

describe("lireFichierTabulaire", () => {
  it("sépare l'en-tête des lignes de données", async () => {
    const resultat = await lireFichierTabulaire(
      chemin("valide-pointvirgule.csv"),
      "valide-pointvirgule.csv",
    );

    expect(resultat.entetes[0]).toBe("identifiant_indic");
    expect(resultat.lignes).toHaveLength(2);
  });

  it("numérote les lignes comme le tableur, en-tête comprise", async () => {
    const resultat = await lireFichierTabulaire(
      chemin("ligne-vide-milieu.csv"),
      "ligne-vide-milieu.csv",
    );

    expect(resultat.numerosDeLigneSource).toEqual([2, 3, 4]);
  });

  it("choisit le lecteur d'après l'extension, insensible à la casse", async () => {
    const resultat = await lireFichierTabulaire(
      chemin("xlsx-valide.xlsx"),
      "XLSX-VALIDE.XLSX",
    );

    expect(resultat.entetes[0]).toBe("identifiant_indic");
  });

  it("refuse une extension non prise en charge", async () => {
    await expect(
      lireFichierTabulaire(chemin("valide-pointvirgule.csv"), "donnees.ods"),
    ).rejects.toThrow(FichierTabulaireIllisibleError);
  });

  it("refuse un fichier sans aucune ligne", async () => {
    await expect(
      lireFichierTabulaire(chemin("vide.csv"), "vide.csv"),
    ).rejects.toThrow(/vide/i);
  });
});
