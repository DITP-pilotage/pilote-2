import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { LocalFichierIndicateurValidationService } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/LocalFichierIndicateurValidationService";

function ecrireFichierCsvTemporaire(contenu: string): string {
  const cheminFichier = path.join(
    os.tmpdir(),
    `import-test-${Date.now()}-${Math.random()}.csv`,
  );
  fs.writeFileSync(cheminFichier, contenu);
  return cheminFichier;
}

describe("LocalFichierIndicateurValidationService", () => {
  let service: LocalFichierIndicateurValidationService;

  beforeEach(() => {
    service = new LocalFichierIndicateurValidationService();
  });

  it("doit valider un fichier correct et construire les mesures", async () => {
    const cheminFichier = ecrireFichierCsvTemporaire(
      "identifiant_indic,zone_id,date_valeur,type_valeur,valeur\nIND-001,D001,2023-01-31,vi,9\n",
    );

    const rapport = await service.validerFichier({
      cheminCompletDuFichier: cheminFichier,
      nomDuFichier: "fichier.csv",
      schema: "sans-contraintes.json",
      utilisateurEmail: "ditp.admin@example.com",
    });

    expect(rapport.estValide).toEqual(true);
    expect(rapport.listeErreursValidation).toEqual([]);
    expect(rapport.listeMesuresIndicateurTemporaire).toHaveLength(1);
    expect(rapport.listeMesuresIndicateurTemporaire[0].indicId).toEqual(
      "IND-001",
    );
    expect(rapport.listeMesuresIndicateurTemporaire[0].zoneId).toEqual("D001");
    expect(rapport.listeMesuresIndicateurTemporaire[0].metricDate).toEqual(
      "2023-01-31",
    );
    expect(rapport.listeMesuresIndicateurTemporaire[0].metricType).toEqual(
      "vi",
    );
    expect(rapport.listeMesuresIndicateurTemporaire[0].metricValue).toEqual(
      "9",
    );
  });

  it("doit remonter une erreur de pattern sur identifiant_indic", async () => {
    const cheminFichier = ecrireFichierCsvTemporaire(
      "identifiant_indic,zone_id,date_valeur,type_valeur,valeur\nINVALIDE,D001,2023-01-31,vi,9\n",
    );

    const rapport = await service.validerFichier({
      cheminCompletDuFichier: cheminFichier,
      nomDuFichier: "fichier.csv",
      schema: "sans-contraintes.json",
      utilisateurEmail: "ditp.admin@example.com",
    });

    expect(rapport.estValide).toEqual(false);
    expect(rapport.listeErreursValidation).toHaveLength(1);
    expect(rapport.listeErreursValidation[0].nomDuChamp).toEqual(
      "identifiant_indic",
    );
    expect(rapport.listeErreursValidation[0].cellule).toEqual("INVALIDE");
    expect(rapport.listeErreursValidation[0].numeroDeLigne).toEqual(2);
    expect(rapport.listeErreursValidation[0].positionDeLigne).toEqual(0);
    expect(rapport.listeErreursValidation[0].message).toEqual(
      "L'identifiant de l'indicateur doit être renseigné dans le format IND-XXX. Vous pouvez vous référer au guide des indicateurs pour trouver l'identifiant de votre indicateur.",
    );
  });

  it("doit remonter une erreur de clé primaire dupliquée", async () => {
    const cheminFichier = ecrireFichierCsvTemporaire(
      "identifiant_indic,zone_id,date_valeur,type_valeur,valeur\n" +
        "IND-001,D001,2023-01-31,vi,9\n" +
        "IND-001,D001,2023-01-31,vi,3\n",
    );

    const rapport = await service.validerFichier({
      cheminCompletDuFichier: cheminFichier,
      nomDuFichier: "fichier.csv",
      schema: "sans-contraintes.json",
      utilisateurEmail: "ditp.admin@example.com",
    });

    expect(rapport.estValide).toEqual(false);
    expect(rapport.listeErreursValidation).toHaveLength(1);
    expect(rapport.listeErreursValidation[0].message).toEqual(
      "La ligne 3 est vide ou comporte les mêmes zone, date, identifiant d'indicateur et type de valeur qu'une autre ligne. Veuillez la modifier ou la supprimer.",
    );
  });

  it("quand l'en-tête identifiant_indic est absente, doit remonter une erreur dédiée et ne construire aucune mesure", async () => {
    const cheminFichier = ecrireFichierCsvTemporaire(
      "id_indic,zone_id,date_valeur,type_valeur,valeur\nIND-001,D001,2023-01-31,vi,9\n",
    );

    const rapport = await service.validerFichier({
      cheminCompletDuFichier: cheminFichier,
      nomDuFichier: "fichier.csv",
      schema: "sans-contraintes.json",
      utilisateurEmail: "ditp.admin@example.com",
    });

    expect(rapport.estValide).toEqual(false);
    expect(rapport.listeMesuresIndicateurTemporaire).toEqual([]);
    expect(rapport.listeErreursValidation).toEqual([
      expect.objectContaining({
        nom: "En-tête incorrect",
        message: "L'en-tête identifiant_indic n'est pas présente",
      }),
    ]);
  });

  it("quand un en-tête comporte un espace, doit remonter une erreur dédiée sans bloquer la construction des mesures", async () => {
    const cheminFichier = ecrireFichierCsvTemporaire(
      '"identifiant_indic",zone_id,date_valeur,type_valeur,"valeur "\nIND-001,D001,2023-01-31,vi,9\n',
    );

    const rapport = await service.validerFichier({
      cheminCompletDuFichier: cheminFichier,
      nomDuFichier: "fichier.csv",
      schema: "sans-contraintes.json",
      utilisateurEmail: "ditp.admin@example.com",
    });

    expect(rapport.listeErreursValidation).toContainEqual(
      expect.objectContaining({
        nom: "En-tête incorrect",
        message:
          "Le champ de l'en-tête 'valeur' comporte des espaces, veuillez les supprimer",
      }),
    );
    expect(rapport.listeMesuresIndicateurTemporaire).toHaveLength(1);
  });

  it("quand la validation échoue avec une exception (schéma inexistant), doit remonter un message générique", async () => {
    const cheminFichier = ecrireFichierCsvTemporaire(
      "identifiant_indic,zone_id,date_valeur,type_valeur,valeur\nIND-001,D001,2023-01-31,vi,9\n",
    );

    const rapport = await service.validerFichier({
      cheminCompletDuFichier: cheminFichier,
      nomDuFichier: "fichier.csv",
      schema: "inexistant.json",
      utilisateurEmail: "ditp.admin@example.com",
    });

    expect(rapport.estValide).toEqual(false);
    expect(rapport.listeErreursValidation[0].message).toEqual(
      "Une erreur est survenue lors de la validation de la forme du fichier",
    );
  });
});
