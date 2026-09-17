import {
  construireCsv,
  construireXlsx,
  deposerDansUnFichierTemporaire,
} from "@/server/infrastructure/fichier-tabulaire/fichierTabulaire.builder";
import { LocalFichierIndicateurValidationService } from "@/server/import-indicateur/infrastructure/adapters/validation-fichier/LocalFichierIndicateurValidationService";

const ENTETE = [
  "identifiant_indic",
  "zone_id",
  "zone_nom",
  "date_valeur",
  "type_valeur",
  "valeur",
];
const LIGNE = ["IND-001", "D46", "Lot", "2023-01-31", "vi", "12.5"];

const valider = (
  nom: string,
  contenu: Buffer,
  schema = "sans-contraintes.json",
) =>
  new LocalFichierIndicateurValidationService().validerFichier({
    cheminCompletDuFichier: deposerDansUnFichierTemporaire(nom, contenu),
    nomDuFichier: nom,
    schema,
    utilisateurEmail: "ditp.admin@example.com",
  });

const validerCsv = (lignes: string[][], schema?: string) =>
  valider("import.csv", construireCsv(lignes), schema);

const messagesDe = (rapport: {
  listeErreursValidation: { message: string }[];
}) => rapport.listeErreursValidation.map((erreur) => erreur.message);

describe("LocalFichierIndicateurValidationService", () => {
  it("valide un fichier conforme et construit ses mesures temporaires", async () => {
    const rapport = await validerCsv([ENTETE, LIGNE]);

    expect(rapport.estValide).toBe(true);
    expect(rapport.listeErreursValidation).toEqual([]);
    expect(
      rapport.listeMesuresIndicateurTemporaire.map((mesure) => ({
        indicId: mesure.indicId,
        zoneId: mesure.zoneId,
        metricDate: mesure.metricDate,
        metricType: mesure.metricType,
        metricValue: mesure.metricValue,
      })),
    ).toEqual([
      {
        indicId: "IND-001",
        zoneId: "D46",
        metricDate: "2023-01-31",
        metricType: "vi",
        metricValue: "12.5",
      },
    ]);
  });

  it("accepte un fichier dont une colonne hors clé primaire est absente", async () => {
    const entete = ENTETE.filter((colonne) => colonne !== "valeur");
    const ligne = LIGNE.slice(0, 5);

    const rapport = await validerCsv([entete, ligne]);

    expect(rapport.estValide).toBe(true);
  });

  it("refuse un fichier dont une colonne de clé primaire est absente", async () => {
    const entete = ENTETE.filter((colonne) => colonne !== "identifiant_indic");

    const rapport = await validerCsv([entete, LIGNE.slice(1)]);

    expect(rapport.estValide).toBe(false);
    expect(messagesDe(rapport)).toContain(
      "L'en-tête identifiant_indic n'est pas présente",
    );
  });

  it("accepte une colonne surnuméraire absente du schéma", async () => {
    const rapport = await validerCsv([
      [...ENTETE, "colonne_inconnue"],
      [...LIGNE, "peu importe"],
    ]);

    expect(rapport.estValide).toBe(true);
  });

  it("signale un en-tête comportant des espaces", async () => {
    const rapport = await validerCsv([
      [" identifiant_indic", ...ENTETE.slice(1)],
      LIGNE,
    ]);

    expect(messagesDe(rapport)).toContain(
      "Le champ de l'en-tête 'identifiant_indic' comporte des espaces, veuillez les supprimer",
    );
  });

  it("signale un en-tête en majuscules", async () => {
    const rapport = await validerCsv([
      ["IDENTIFIANT_INDIC", ...ENTETE.slice(1)],
      LIGNE,
    ]);

    expect(messagesDe(rapport)).toContain(
      "Le champ de l'en-tête 'identifiant_indic' comporte des majuscules, veuillez les mettre en minuscule",
    );
  });

  it("nomme chaque colonne dupliquée, même s'il y en a plusieurs", async () => {
    const rapport = await validerCsv([
      [...ENTETE, "valeur", "zone_id"],
      [...LIGNE, "2", "D46"],
    ]);

    expect(messagesDe(rapport)).toEqual([
      "La colonne 'zone_id' apparaît 2 fois dans l'en-tête. Chaque colonne ne doit y figurer qu'une seule fois.",
      "La colonne 'valeur' apparaît 2 fois dans l'en-tête. Chaque colonne ne doit y figurer qu'une seule fois.",
    ]);
  });

  it("signale des en-têtes dupliqués sans analyser le contenu", async () => {
    const rapport = await validerCsv([
      [...ENTETE, "valeur"],
      ["IND-XXX", "ZZZ", "Lot", "pas-une-date", "zz", "abc", "2"],
    ]);

    // Les doublons d'en-tête sont bloquants : le contenu n'est pas analysé,
    // donc aucune erreur de ligne ne doit remonter. La colonne fautive est
    // nommée, sinon l'utilisateur doit la chercher lui-même.
    expect(messagesDe(rapport)).toEqual([
      "La colonne 'valeur' apparaît 2 fois dans l'en-tête. Chaque colonne ne doit y figurer qu'une seule fois.",
    ]);
    expect(
      rapport.listeErreursValidation.map((erreur) => ({
        cellule: erreur.cellule,
        nomDuChamp: erreur.nomDuChamp,
      })),
    ).toEqual([{ cellule: "valeur", nomDuChamp: "valeur" }]);
  });

  it("numérote les erreurs avec le numéro de ligne du tableur", async () => {
    const rapport = await validerCsv([
      ENTETE,
      LIGNE,
      ["", "", "", "", "", ""],
      ["IND-002", "R84", "ARA", "2023-02-28", "va", "7"],
    ]);

    expect(
      rapport.listeErreursValidation.map((erreur) => erreur.numeroDeLigne),
    ).toEqual([3, 3]);
  });

  it("signale un doublon de clé primaire sur la seconde occurrence", async () => {
    const rapport = await validerCsv([ENTETE, LIGNE, LIGNE]);

    expect(
      rapport.listeErreursValidation.map((erreur) => ({
        nom: erreur.nom,
        numeroDeLigne: erreur.numeroDeLigne,
      })),
    ).toEqual([{ nom: "Ligne en double", numeroDeLigne: 3 }]);
  });

  it("applique le schéma choisi, et pas un autre", async () => {
    const enRegion = ["IND-001", "R84", "ARA", "2023-01-31", "vi", "1"];

    expect(
      (await validerCsv([ENTETE, enRegion], "restrict-reg.json")).estValide,
    ).toBe(true);
    expect(
      (await validerCsv([ENTETE, enRegion], "restrict-dept.json")).estValide,
    ).toBe(false);
  });

  it("rend le même verdict en CSV et en XLSX", async () => {
    const invalide = ["IND-XXX", "D46", "Lot", "2023-01-31", "vi", "1"];

    const csv = await validerCsv([ENTETE, invalide]);
    const xlsx = await valider(
      "import.xlsx",
      construireXlsx([ENTETE, invalide]),
    );

    expect(xlsx.estValide).toEqual(csv.estValide);
    expect(messagesDe(xlsx)).toEqual(messagesDe(csv));
  });

  it("refuse un format non pris en charge avec un message explicite", async () => {
    const rapport = await valider(
      "donnees.ods",
      construireCsv([ENTETE, LIGNE]),
    );

    expect(rapport.estValide).toBe(false);
    expect(messagesDe(rapport)).toEqual([
      "Le format « .ods » n'est pas pris en charge. Importez un fichier .csv ou .xlsx.",
    ]);
  });

  it("supprime le fichier après lecture", async () => {
    const { existsSync } = await import("node:fs");
    const chemin = deposerDansUnFichierTemporaire(
      "import.csv",
      construireCsv([ENTETE, LIGNE]),
    );

    await new LocalFichierIndicateurValidationService().validerFichier({
      cheminCompletDuFichier: chemin,
      nomDuFichier: "import.csv",
      schema: "sans-contraintes.json",
      utilisateurEmail: "ditp.admin@example.com",
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(existsSync(chemin)).toBe(false);
  });
});
