import { createMocks } from "node-mocks-http";
import { NextApiRequest, NextApiResponse } from "next";
import { anyString } from "vitest-mock-extended";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import UtilisateurÀCréerOuMettreÀJourBuilder from "@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder";
import { getNextAuthSessionTokenPourUtilisateurEmail } from "@/server/infrastructure/test/NextAuthHelper";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { getContainer } from "@/server/dependances";
import { prisma } from "@/server/db/prisma";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";

// Seule la couche de transport HTTP est simulée : il n'y a plus d'appel réseau
// à simuler, le fichier est lu et validé pour de vrai.
const etat = vi.hoisted(() => ({
  fichier: { filepath: "", originalFilename: "" },
}));

vi.mock("@/server/import-indicateur/infrastructure/handlers/ParseForm", () => ({
  parseForm: () => ({ file: [etat.fichier] }),
}));

// node-mocks-http 1.18 rend `_getJSONData()` en `unknown` et non plus `any`.
type RapportDeValidation = {
  id: string;
  estValide: boolean;
  listeErreursValidation: { message: string; nomDuChamp: string }[];
};

const EMAIL_ADMIN = "ditp.admin@example.com";
const ENTETE = "identifiant_indic;zone_id;date_valeur;type_valeur;valeur";

function deposerFichier(nom: string, contenu: Buffer | string) {
  const dossier = mkdtempSync(join(tmpdir(), "import-verif-"));
  const chemin = join(dossier, nom);
  writeFileSync(chemin, contenu);
  etat.fichier = { filepath: chemin, originalFilename: nom };
  return chemin;
}

function deposerCsv(lignes: string[]) {
  return deposerFichier(
    "import.csv",
    `${[ENTETE, ...lignes].join("\r\n")}\r\n`,
  );
}

async function creeUnUtilisateurEnBase() {
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
  return auteurId;
}

async function creerAdminEtSeConnecter() {
  const auteurId = await creeUnUtilisateurEnBase();
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

async function verifier(sessionToken: string, indicateurId: string) {
  // next-auth v5 lit les cookies depuis le header "cookie", pas depuis req.cookies
  const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
    method: "POST",
    body: new FormData(),
    cookies: { "authjs.session-token": sessionToken },
    headers: { cookie: `authjs.session-token=${sessionToken}` },
    query: { indicateurId },
  });

  await getContainer("importIndicateur")
    .resolve("verifierFichierImportIndicateurHandler")
    .handle(req, res);

  return {
    statut: res._getStatusCode(),
    rapport: res._getJSONData() as RapportDeValidation,
  };
}

const messagesDe = (rapport: RapportDeValidation) =>
  rapport.listeErreursValidation.map((erreur) => erreur.message);

describe("VerifierImportIndicateurHandler", () => {
  it(
    "valide un fichier CSV conforme et persiste ses mesures temporaires",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();
      deposerCsv([
        "IND-001;D046;2023-12-30;vi;9",
        "IND-001;D004;2023-12-31;vc;3",
      ]);

      const { statut, rapport } = await verifier(sessionToken, "IND-001");

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
    "refuse un identifiant d'indicateur au mauvais format, avec un message en français",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();
      deposerCsv(["IND-XXX;D046;2023-12-30;vi;9"]);

      const { statut, rapport } = await verifier(sessionToken, "IND-XXX");

      expect(statut).toEqual(200);
      expect(rapport.estValide).toBe(false);
      expect(messagesDe(rapport)).toContain(
        "L'identifiant de l'indicateur doit être renseigné dans le format IND-XXX. Vous pouvez vous référer au guide des indicateurs pour trouver l'identifiant de votre indicateur.",
      );
    }),
  );

  it(
    "signale l'absence de l'en-tête identifiant_indic",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();
      deposerFichier(
        "import.csv",
        "zone_id;date_valeur;type_valeur;valeur\r\nD046;2023-12-30;vi;9\r\n",
      );

      const { rapport } = await verifier(sessionToken, "IND-001");

      expect(rapport.estValide).toBe(false);
      expect(messagesDe(rapport)).toContain(
        "L'en-tête identifiant_indic n'est pas présente",
      );
    }),
  );

  it(
    "lit un CSV séparé par des virgules comme un CSV séparé par des points-virgules",
    createIntegrationTest(async () => {
      const sessionToken = await creerAdminEtSeConnecter();
      deposerFichier(
        "import.csv",
        "identifiant_indic,zone_id,date_valeur,type_valeur,valeur\r\nIND-001,D046,2023-12-30,vi,9\r\n",
      );

      const { rapport } = await verifier(sessionToken, "IND-001");

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
      deposerFichier("import.ods", "peu importe");

      const { rapport } = await verifier(sessionToken, "IND-001");

      expect(rapport.estValide).toBe(false);
      expect(messagesDe(rapport)).toContain(
        "Le format « .ods » n'est pas pris en charge. Importez un fichier .csv ou .xlsx.",
      );
    }),
  );
});
