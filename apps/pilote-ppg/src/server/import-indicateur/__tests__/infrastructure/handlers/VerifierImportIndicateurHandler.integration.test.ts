import { randomUUID } from "node:crypto";
import { anyString } from "vitest-mock-extended";
import UtilisateurÀCréerOuMettreÀJourBuilder from "@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder";
import { getContainer } from "@/server/dependances";
import { prisma } from "@/server/db/prisma";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { getNextAuthSessionTokenPourUtilisateurEmail } from "@/server/infrastructure/test/NextAuthHelper";
import { construireCsv } from "@/server/infrastructure/fichier-tabulaire/fichierTabulaire.builder";
import { requeteMultipart } from "@/server/import-indicateur/__tests__/infrastructure/handlers/requeteImport.builder";

// node-mocks-http 1.18 rend `_getJSONData()` en `unknown` et non plus `any`.
type RapportDeValidation = {
  id: string;
  estValide: boolean;
  listeErreursValidation: {
    nom: string;
    message: string;
    nomDuChamp: string;
  }[];
};

const EMAIL_ADMIN = "ditp.admin@example.com";
const COLONNES = [
  "identifiant_indic",
  "zone_id",
  "date_valeur",
  "type_valeur",
  "valeur",
];

const csv = (lignes: string[][]) => construireCsv([COLONNES, ...lignes]);

async function creerAdminEtSeConnecter() {
  const auteurId = randomUUID();
  await prisma.utilisateur.create({
    data: {
      id: auteurId,
      email: "john.doe@test.com",
      nom: "John",
      prenom: "Doe",
      date_creation: new Date().toISOString(),
      profil: { connect: { code: ProfilEnum.DITP_ADMIN } },
    },
  });

  const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder()
    .avecEmail(EMAIL_ADMIN)
    .avecProfil(ProfilEnum.DITP_ADMIN)
    .avecHabilitationsLecture([], [], [])
    .build();
  await getContainer("authentification")
    .resolve("utilisateurRepository")
    .créerOuMettreÀJour(utilisateur, auteurId);

  return getNextAuthSessionTokenPourUtilisateurEmail(EMAIL_ADMIN);
}

async function verifier({
  sessionToken,
  indicateurId,
  contenu,
  nomDuFichier = "import.csv",
}: {
  sessionToken: string;
  indicateurId: string;
  contenu: Buffer;
  nomDuFichier?: string;
}) {
  const { request, response } = requeteMultipart({
    contenu,
    nomDuFichier,
    indicateurId,
    sessionToken,
  });

  await getContainer("importIndicateur")
    .resolve("verifierFichierImportIndicateurHandler")
    .handle(request, response);

  return {
    statut: response._getStatusCode(),
    rapport: response._getJSONData() as RapportDeValidation,
  };
}

const messagesDe = (rapport: RapportDeValidation) =>
  rapport.listeErreursValidation.map((erreur) => erreur.message);

describe("VerifierImportIndicateurHandler", () => {
  it(
    "valide un fichier CSV conforme et persiste ses mesures temporaires",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();

      const { statut, rapport } = await verifier({
        sessionToken,
        indicateurId: "IND-001",
        contenu: csv([
          ["IND-001", "D46", "2023-12-30", "vi", "9"],
          ["IND-001", "D04", "2023-12-31", "vc", "3"],
        ]),
      });

      expect(statut).toEqual(200);
      expect(rapport).toStrictEqual({
        id: anyString(),
        estValide: true,
        listeErreursValidation: [],
      });
      expect(
        await prisma.mesure_indicateur_temporaire.count({
          where: { rapport_id: rapport.id },
        }),
      ).toEqual(2);
    }),
  );

  it(
    "refuse un identifiant au mauvais format, avec un message en français",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();

      const { rapport } = await verifier({
        sessionToken,
        indicateurId: "IND-XXX",
        contenu: csv([["IND-XXX", "D46", "2023-12-30", "vi", "9"]]),
      });

      expect(rapport.estValide).toBe(false);
      expect(messagesDe(rapport)).toContain(
        "'IND-XXX' n'est pas un identifiant d'indicateur valide (ligne 2) : il doit être composé de 'IND-' suivi de 3 ou 4 chiffres. Exemple attendu : IND-001. Vous pouvez vous référer au guide des indicateurs pour trouver celui de votre indicateur.",
      );
    }),
  );

  it(
    "signale l'absence de l'en-tête identifiant_indic",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();

      const { rapport } = await verifier({
        sessionToken,
        indicateurId: "IND-001",
        contenu: construireCsv([
          ["zone_id", "date_valeur", "type_valeur", "valeur"],
          ["D46", "2023-12-30", "vi", "9"],
        ]),
      });

      expect(rapport.estValide).toBe(false);
      expect(messagesDe(rapport)).toContain(
        "L'en-tête identifiant_indic n'est pas présent",
      );
    }),
  );

  it(
    "lit un CSV séparé par des virgules comme un CSV séparé par des points-virgules",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();

      const { rapport } = await verifier({
        sessionToken,
        indicateurId: "IND-001",
        contenu: construireCsv(
          [COLONNES, ["IND-001", "D46", "2023-12-30", "vi", "9"]],
          { delimiteur: "," },
        ),
      });

      expect(rapport).toStrictEqual({
        id: anyString(),
        estValide: true,
        listeErreursValidation: [],
      });
    }),
  );

  it(
    "refuse un format de fichier non pris en charge avec un message explicite",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();

      const { rapport } = await verifier({
        sessionToken,
        indicateurId: "IND-001",
        nomDuFichier: "import.ods",
        contenu: Buffer.from("peu importe"),
      });

      expect(rapport.estValide).toBe(false);
      expect(messagesDe(rapport)).toContain(
        "Le format « .ods » n'est pas pris en charge. Importez un fichier .csv ou .xlsx.",
      );
    }),
  );

  it(
    "signale une date illisible sans effacer le reste du rapport",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();

      const { rapport } = await verifier({
        sessionToken,
        indicateurId: "IND-001",
        contenu: csv([["IND-001", "D46", "pas-une-date", "vi", "9"]]),
      });

      expect(rapport.estValide).toBe(false);
      // `new Date("pas-une-date").toISOString()` leve : sans garde, l'exception
      // remontait au catch du use case et remplacait tout le rapport par
      // "Une erreur est survenue lors de la validation du contenu du fichier".
      expect(messagesDe(rapport)).not.toContain(
        "Une erreur est survenue lors de la validation du contenu du fichier",
      );
      expect(messagesDe(rapport).join(" ")).toContain("pas-une-date");
    }),
  );

  it(
    "ne signale qu'une fois une cellule fautive",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();

      const { rapport } = await verifier({
        sessionToken,
        indicateurId: "IND-001",
        contenu: csv([["IND-001", "D46", "pas-une-date", "vi", "9"]]),
      });

      // Le format et l'existence de la date sont deux contrôles distincts : le
      // second n'a rien à ajouter sur une cellule que le premier a rejetée.
      expect(
        rapport.listeErreursValidation.map((erreur) => erreur.nomDuChamp),
      ).toEqual(["date_valeur"]);
    }),
  );

  it(
    "vérifie toujours qu'une date bien formée existe vraiment",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();

      // 2023-02-30 respecte le motif du schéma mais n'existe pas.
      const { rapport } = await verifier({
        sessionToken,
        indicateurId: "IND-001",
        contenu: csv([["IND-001", "D46", "2023-02-30", "vi", "9"]]),
      });

      expect(rapport.estValide).toBe(false);
      expect(messagesDe(rapport)).toContain(
        "La date '2023-02-30' n'est pas une date valide (ligne 2).",
      );
    }),
  );

  it(
    "n'ajoute pas d'erreur d'indicateur sur un identifiant déjà rejeté",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();

      const { rapport } = await verifier({
        sessionToken,
        indicateurId: "IND-001",
        contenu: csv([["IND-XXX", "D46", "2026-01-31", "vi", "9"]]),
      });

      expect(
        rapport.listeErreursValidation.map((erreur) => erreur.nomDuChamp),
      ).toEqual(["identifiant_indic"]);
    }),
  );

  it(
    "ne reproche rien d'autre à une ligne entièrement vide",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();

      const { rapport } = await verifier({
        sessionToken,
        indicateurId: "IND-001",
        contenu: csv([
          ["IND-001", "D46", "2026-01-31", "vi", "9"],
          ["", "", "", "", ""],
        ]),
      });

      // Une ligne vide est signalée comme vide et comme clé en double. Lui
      // reprocher en plus son identifiant n'apprendrait rien.
      expect(
        rapport.listeErreursValidation.map((erreur) => erreur.nom),
      ).toEqual(["Ligne vide", "Ligne en double"]);
    }),
  );

  it(
    "n'affiche que des libellés français dans le rapport",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();

      const { rapport } = await verifier({
        sessionToken,
        indicateurId: "IND-001",
        contenu: csv([
          ["IND-001", "ZZZ", "2026-01-31", "zz", "abc"],
          ["", "", "", "", ""],
        ]),
      });

      for (const erreur of rapport.listeErreursValidation) {
        expect(erreur.nom).not.toMatch(/^[a-z-]+$/);
      }
    }),
  );

  it(
    "explique qu'un fichier vide est vide, au lieu de casser",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();

      // formidable refuse les fichiers vides par défaut, en levant depuis
      // parseForm : la route renvoyait un 500 et l'écran restait muet.
      const { statut, rapport } = await verifier({
        sessionToken,
        indicateurId: "IND-001",
        contenu: Buffer.from(""),
      });

      expect(statut).toEqual(200);
      expect(rapport.estValide).toBe(false);
      expect(messagesDe(rapport)).toEqual(["Le fichier est vide."]);
    }),
  );
});
