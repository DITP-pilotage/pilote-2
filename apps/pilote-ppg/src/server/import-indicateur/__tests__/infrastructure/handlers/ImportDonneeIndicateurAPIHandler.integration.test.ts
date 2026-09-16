import { createMocks } from "node-mocks-http";
import { NextApiRequest, NextApiResponse } from "next";
import { mock } from "vitest-mock-extended";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import UtilisateurÀCréerOuMettreÀJourBuilder from "@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { getContainer } from "@/server/dependances";
import { prisma } from "@/server/db/prisma";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";

// node-mocks-http 1.18 rend `_getJSONData()` en `unknown` et non plus `any`.
type CorpsReponseImport = {
  message: string;
  erreurs: { message: string; cellule?: string; nomDuChamp?: string }[];
};

// Seule la couche de transport HTTP est simulée : il n'y a plus d'appel réseau
// à simuler, le fichier est lu et validé pour de vrai.
const etat = vi.hoisted(() => ({
  fichier: { filepath: "", originalFilename: "" },
}));

vi.mock("@/server/import-indicateur/infrastructure/handlers/ParseForm", () => ({
  parseForm: () => ({ file: [etat.fichier] }),
}));

const EMAIL_ADMIN = "ditp.admin@example.com";
const ENTETE = "identifiant_indic;zone_id;date_valeur;type_valeur;valeur";

function deposerCsv(lignes: string[]) {
  const dossier = mkdtempSync(join(tmpdir(), "import-api-"));
  const chemin = join(dossier, "import.csv");
  writeFileSync(chemin, `${[ENTETE, ...lignes].join("\r\n")}\r\n`);
  etat.fichier = { filepath: chemin, originalFilename: "import.csv" };
}

async function creerAdminEnBase() {
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

  return auteurId;
}

async function importer(
  auteurId: string,
  contentType: string,
  corpsJson?: unknown,
) {
  const { req: request, res: response } = createMocks<
    NextApiRequest,
    NextApiResponse
  >({
    method: "POST",
    headers: { "content-type": contentType },
    query: { indicateurId: "IND-001" },
  });

  if (corpsJson !== undefined) {
    request.read = mock<() => string>(() => JSON.stringify(corpsJson));
  }

  await getContainer("importIndicateur")
    .resolve("importDonneeIndicateurAPIHandler")
    .handle({
      request,
      response,
      utilisateurId: auteurId,
      email: EMAIL_ADMIN,
      profil: ProfilEnum.DITP_ADMIN,
    });

  return response;
}

describe("ImportDonneeIndicateurAPIHandler", () => {
  describe("quand les données arrivent en JSON", () => {
    it(
      "importe des données conformes",
      createIntegrationTest(async () => {
        const auteurId = await creerAdminEnBase();

        const response = await importer(auteurId, "application/json", {
          donnees: [
            {
              identifiant_indic: "IND-001",
              zone_id: "D046",
              zone_nom: "Lot",
              date_valeur: "2023-03-31",
              type_valeur: "va",
              valeur: "9",
            },
          ],
        });

        expect(response._getStatusCode()).toEqual(200);
        expect(
          (response._getJSONData() as { message: string }).message,
        ).toEqual("Les données ont correctement été importés");
      }),
    );

    it(
      "refuse des données non conformes et remonte les erreurs en français",
      createIntegrationTest(async () => {
        const auteurId = await creerAdminEnBase();

        const response = await importer(auteurId, "application/json", {
          donnees: [
            {
              identifiant_indic: "IND-001",
              zone_id: "ZONE-INCONNUE",
              zone_nom: "Nulle part",
              date_valeur: "2023-03-31",
              type_valeur: "va",
              valeur: "9",
            },
          ],
        });

        const data = response._getJSONData() as CorpsReponseImport;

        expect(response._getStatusCode()).toEqual(400);
        expect(data.message).toEqual(
          "Une erreur est survenue lors de l'import des données",
        );
        expect(data.erreurs.map((erreur) => erreur.nomDuChamp)).toContain(
          "zone_id",
        );
      }),
    );
  });

  describe("quand les données arrivent en multipart", () => {
    it(
      "importe un fichier conforme",
      createIntegrationTest(async () => {
        const auteurId = await creerAdminEnBase();
        deposerCsv(["IND-001;D046;2023-03-31;va;9"]);

        const response = await importer(auteurId, "multipart/form-data");

        expect(response._getStatusCode()).toEqual(200);
        expect(
          (response._getJSONData() as { message: string }).message,
        ).toEqual("Les données ont correctement été importés");
      }),
    );

    it(
      "refuse un fichier non conforme et remonte les erreurs",
      createIntegrationTest(async () => {
        const auteurId = await creerAdminEnBase();
        deposerCsv(["IND-001;D046;2023-03-31;type-inconnu;9"]);

        const response = await importer(auteurId, "multipart/form-data");

        const data = response._getJSONData() as CorpsReponseImport;

        expect(response._getStatusCode()).toEqual(400);
        expect(data.erreurs.map((erreur) => erreur.message)).toContain(
          "Le type de valeur doit être vi (valeur initiale), va (valeur d'avancement) ou vc (valeur cible).",
        );
      }),
    );

    it(
      "persiste les erreurs de validation en base",
      createIntegrationTest(async () => {
        const auteurId = await creerAdminEnBase();
        deposerCsv(["IND-001;D046;2023-03-31;type-inconnu;9"]);

        await importer(auteurId, "multipart/form-data");

        expect(await prisma.erreur_validation_fichier.count()).toBeGreaterThan(
          0,
        );
      }),
    );
  });
});
