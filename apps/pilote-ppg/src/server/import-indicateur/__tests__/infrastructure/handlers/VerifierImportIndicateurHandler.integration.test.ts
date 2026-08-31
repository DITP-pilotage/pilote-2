import { createMocks } from "node-mocks-http";
import { anyString, mock } from "vitest-mock-extended";
import PersistentFile from "formidable/PersistentFile";
import { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "node:crypto";
import { DetailValidationFichierBuilder } from "@/server/import-indicateur/app/builder/DetailValidationFichier.builder";
import { ErreurValidationFichierBuilder } from "@/server/import-indicateur/app/builder/ErreurValidationFichier.builder";
import { MesureIndicateurTemporaireBuilder } from "@/server/import-indicateur/app/builder/MesureIndicateurTemporaire.builder";
import UtilisateurÀCréerOuMettreÀJourBuilder from "@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder";
import { getNextAuthSessionTokenPourUtilisateurEmail } from "@/server/infrastructure/test/NextAuthHelper";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { getContainer } from "@/server/dependances";
import { prisma } from "@/server/db/prisma";

const validerFichierMock = vi.fn();

vi.mock(
  "@/server/import-indicateur/infrastructure/adapters/validation-fichier/LocalFichierIndicateurValidationService",
  () => ({
    LocalFichierIndicateurValidationService: vi
      .fn()
      .mockImplementation(() => ({ validerFichier: validerFichierMock })),
  }),
);
vi.mock("@/server/import-indicateur/infrastructure/handlers/ParseForm", () => ({
  parseForm: () => ({
    file: mock<PersistentFile>(),
  }),
}));
vi.mock(
  "@/server/import-indicateur/infrastructure/adapters/FichierService.ts",
  () => ({
    recupererFichier: () => "fichierRécupéré",
    supprimerLeFichier: () => "fichierSupprimé",
  }),
);

const DONNEE_DATE_1 = "2023-12-30";
const DONNEE_DATE_2 = "31/12/2023";

// next-auth v5 lit les cookies depuis le header "cookie", pas depuis req.cookies
async function createMocksAvecSessionToken(
  sessionToken: string,
  indicateurId: string,
) {
  return createMocks<NextApiRequest, NextApiResponse>({
    method: "POST",
    body: new FormData(),
    cookies: {
      "authjs.session-token": sessionToken,
    },
    headers: {
      cookie: `authjs.session-token=${sessionToken}`,
    },
    query: { indicateurId },
  });
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
      profil: {
        connect: {
          code: ProfilEnum.DITP_ADMIN,
        },
      },
    },
  });
  return auteurId;
}

beforeEach(() => {
  validerFichierMock.mockReset();
});

describe("VerifierImportIndicateurHandler", () => {
  describe("Quand le fichier envoyé est correct", () => {
    it("doit retourner que le fichier est valide", async () => {
      // Given
      const auteurId = await creeUnUtilisateurEnBase();
      const rapportId = randomUUID();
      validerFichierMock.mockResolvedValue(
        new DetailValidationFichierBuilder()
          .avecId(rapportId)
          .avecEstValide(true)
          .avecUtilisateurEmail("ditp.admin@example.com")
          .avecListeMesuresIndicateurTemporaire(
            new MesureIndicateurTemporaireBuilder()
              .avecId(randomUUID())
              .avecRapportId(rapportId)
              .avecIndicId("IND-001")
              .avecZoneId("D001")
              .avecMetricDate(DONNEE_DATE_1)
              .avecMetricType("vi")
              .avecMetricValue("9")
              .build(),
            new MesureIndicateurTemporaireBuilder()
              .avecId(randomUUID())
              .avecRapportId(rapportId)
              .avecIndicId("IND-001")
              .avecZoneId("D004")
              .avecMetricDate(DONNEE_DATE_2)
              .avecMetricType("vc")
              .avecMetricValue("3")
              .build(),
          )
          .build(),
      );

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder()
        .avecEmail("ditp.admin@example.com")
        .avecProfil(ProfilEnum.DITP_ADMIN)
        .avecHabilitationsLecture([], [], [])
        .build();
      await getContainer("authentification")
        .resolve("utilisateurRepository")
        .créerOuMettreÀJour(utilisateur, auteurId);

      // When
      const sessionToken = await getNextAuthSessionTokenPourUtilisateurEmail(
        "ditp.admin@example.com",
      );
      const { req, res } = await createMocksAvecSessionToken(
        sessionToken,
        "IND-001",
      );

      await getContainer("importIndicateur")
        .resolve("verifierFichierImportIndicateurHandler")
        .handle(req, res);

      // Then
      expect(res._getStatusCode()).toEqual(200);
      expect(res._getJSONData()).toStrictEqual({
        id: anyString(),
        estValide: true,
        listeErreursValidation: [],
      });
    });

    it("doit sauvegarder les données du fichier", async () => {
      // Given
      const auteurId = await creeUnUtilisateurEnBase();
      const rapportId = randomUUID();
      validerFichierMock.mockResolvedValue(
        new DetailValidationFichierBuilder()
          .avecId(rapportId)
          .avecEstValide(true)
          .avecUtilisateurEmail("ditp.admin@example.com")
          .avecListeMesuresIndicateurTemporaire(
            new MesureIndicateurTemporaireBuilder()
              .avecId(randomUUID())
              .avecRapportId(rapportId)
              .avecIndicId("IND-001")
              .avecZoneId("D001")
              .avecMetricDate(DONNEE_DATE_1)
              .avecMetricType("vi")
              .avecMetricValue("9")
              .build(),
            new MesureIndicateurTemporaireBuilder()
              .avecId(randomUUID())
              .avecRapportId(rapportId)
              .avecIndicId("IND-001")
              .avecZoneId("D004")
              .avecMetricDate(DONNEE_DATE_2)
              .avecMetricType("vc")
              .avecMetricValue("3")
              .build(),
          )
          .build(),
      );

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder()
        .avecEmail("ditp.admin@example.com")
        .avecProfil(ProfilEnum.DITP_ADMIN)
        .avecHabilitationsLecture([], [], [])
        .build();
      await getContainer("authentification")
        .resolve("utilisateurRepository")
        .créerOuMettreÀJour(utilisateur, auteurId);

      const sessionToken = await getNextAuthSessionTokenPourUtilisateurEmail(
        "ditp.admin@example.com",
      );
      const { req, res } = await createMocksAvecSessionToken(
        sessionToken,
        "IND-001",
      );

      // When
      await getContainer("importIndicateur")
        .resolve("verifierFichierImportIndicateurHandler")
        .handle(req, res);

      // Then
      const listeDonneesFichier =
        await prisma.mesure_indicateur_temporaire.findMany({
          orderBy: { indic_id: "asc" },
        });
      expect(listeDonneesFichier).toHaveLength(2);
      expect(listeDonneesFichier[0].indic_id).toEqual("IND-001");
      expect(listeDonneesFichier[0].zone_id).toEqual("D001");
      expect(listeDonneesFichier[0].metric_date).toEqual(DONNEE_DATE_1);
      expect(listeDonneesFichier[0].metric_type).toEqual("vi");
      expect(listeDonneesFichier[0].metric_value).toEqual("9");

      expect(listeDonneesFichier[1].indic_id).toEqual("IND-001");
      expect(listeDonneesFichier[1].zone_id).toEqual("D004");
      expect(listeDonneesFichier[1].metric_date).toEqual("2023-12-31");
      expect(listeDonneesFichier[1].metric_type).toEqual("vc");
      expect(listeDonneesFichier[1].metric_value).toEqual("3");
    });

    it("doit sauvegarder le rapport pour lié à l'utilisateur", async () => {
      // Given
      const auteurId = await creeUnUtilisateurEnBase();
      validerFichierMock.mockResolvedValue(
        new DetailValidationFichierBuilder()
          .avecId(randomUUID())
          .avecEstValide(true)
          .avecUtilisateurEmail("ditp.admin@example.com")
          .build(),
      );

      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder()
        .avecEmail("ditp.admin@example.com")
        .avecProfil(ProfilEnum.DITP_ADMIN)
        .avecHabilitationsLecture([], [], [])
        .build();
      await getContainer("authentification")
        .resolve("utilisateurRepository")
        .créerOuMettreÀJour(utilisateur, auteurId);

      const sessionToken = await getNextAuthSessionTokenPourUtilisateurEmail(
        "ditp.admin@example.com",
      );
      const { req, res } = await createMocksAvecSessionToken(
        sessionToken,
        "IND-001",
      );

      // When
      await getContainer("importIndicateur")
        .resolve("verifierFichierImportIndicateurHandler")
        .handle(req, res);

      // Then
      const listeRapport =
        await prisma.rapport_import_mesure_indicateur.findMany();
      expect(listeRapport).toHaveLength(1);

      expect(listeRapport[0].utilisateurEmail).toEqual(
        "ditp.admin@example.com",
      );
    });
  });

  it("Quand le fichier envoyé est incorrect, doit retourner les erreurs du fichier", async () => {
    // Given
    const auteurId = await creeUnUtilisateurEnBase();
    const rapportId = randomUUID();
    validerFichierMock.mockResolvedValue(
      new DetailValidationFichierBuilder()
        .avecId(rapportId)
        .avecEstValide(false)
        .avecUtilisateurEmail("ditp.admin@example.com")
        .avecListeErreursValidation(
          new ErreurValidationFichierBuilder()
            .avecId(randomUUID())
            .avecRapportId(rapportId)
            .avecCellule("cellule 1")
            .avecNom("nom 1")
            .avecNomDuChamp("nom du champ 1")
            .avecPositionDuChamp(1)
            .avecMessage("message 1")
            .avecNumeroDeLigne(1)
            .avecPositionDeLigne(0)
            .build(),
          new ErreurValidationFichierBuilder()
            .avecId(randomUUID())
            .avecRapportId(rapportId)
            .avecCellule("cellule 2")
            .avecNom("nom 2")
            .avecNomDuChamp("nom du champ 2")
            .avecPositionDuChamp(2)
            .avecMessage("message 2")
            .avecNumeroDeLigne(2)
            .avecPositionDeLigne(1)
            .build(),
        )
        .build(),
    );

    const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder()
      .avecEmail("ditp.admin@example.com")
      .avecProfil(ProfilEnum.DITP_ADMIN)
      .avecHabilitationsLecture([], [], [])
      .build();
    await getContainer("authentification")
      .resolve("utilisateurRepository")
      .créerOuMettreÀJour(utilisateur, auteurId);

    // When
    const sessionToken = await getNextAuthSessionTokenPourUtilisateurEmail(
      "ditp.admin@example.com",
    );
    const { req, res } = await createMocksAvecSessionToken(
      sessionToken,
      "IND-001",
    );

    await getContainer("importIndicateur")
      .resolve("verifierFichierImportIndicateurHandler")
      .handle(req, res);

    // Then
    expect(res._getStatusCode()).toEqual(200);
    expect(res._getJSONData()).toStrictEqual({
      id: anyString(),
      estValide: false,
      listeErreursValidation: [
        {
          cellule: "cellule 1",
          nom: "nom 1",
          message: "message 1",
          numeroDeLigne: 1,
          positionDeLigne: 0,
          nomDuChamp: "nom du champ 1",
          positionDuChamp: 1,
        },
        {
          cellule: "cellule 2",
          nom: "nom 2",
          message: "message 2",
          numeroDeLigne: 2,
          positionDeLigne: 1,
          nomDuChamp: "nom du champ 2",
          positionDuChamp: 2,
        },
      ],
    });
  });

  it("Quand le fichier envoyé est incorrect, doit sauvegarder les erreurs du fichier", async () => {
    // Given
    const auteurId = await creeUnUtilisateurEnBase();
    const rapportId = randomUUID();
    validerFichierMock.mockResolvedValue(
      new DetailValidationFichierBuilder()
        .avecId(rapportId)
        .avecEstValide(false)
        .avecUtilisateurEmail("ditp.admin@example.com")
        .avecListeErreursValidation(
          new ErreurValidationFichierBuilder()
            .avecId(randomUUID())
            .avecRapportId(rapportId)
            .avecCellule("cellule 1")
            .avecNom("nom 1")
            .avecNomDuChamp("nom du champ 1")
            .avecPositionDuChamp(1)
            .avecMessage("message 1")
            .avecNumeroDeLigne(1)
            .avecPositionDeLigne(0)
            .build(),
          new ErreurValidationFichierBuilder()
            .avecId(randomUUID())
            .avecRapportId(rapportId)
            .avecCellule("cellule 2")
            .avecNom("nom 2")
            .avecNomDuChamp("nom du champ 2")
            .avecPositionDuChamp(2)
            .avecMessage("message 2")
            .avecNumeroDeLigne(2)
            .avecPositionDeLigne(1)
            .build(),
        )
        .build(),
    );

    const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder()
      .avecEmail("ditp.admin@example.com")
      .avecProfil(ProfilEnum.DITP_ADMIN)
      .avecHabilitationsLecture([], [], [])
      .build();
    await getContainer("authentification")
      .resolve("utilisateurRepository")
      .créerOuMettreÀJour(utilisateur, auteurId);

    // When
    const sessionToken = await getNextAuthSessionTokenPourUtilisateurEmail(
      "ditp.admin@example.com",
    );
    const { req, res } = await createMocksAvecSessionToken(
      sessionToken,
      "IND-001",
    );

    await getContainer("importIndicateur")
      .resolve("verifierFichierImportIndicateurHandler")
      .handle(req, res);

    // Then
    expect(res._getStatusCode()).toEqual(200);
    const listeErreursValidationFichier =
      await prisma.erreur_validation_fichier.findMany();
    expect(listeErreursValidationFichier[0].cellule).toEqual("cellule 1");
    expect(listeErreursValidationFichier[0].nom).toEqual("nom 1");
    expect(listeErreursValidationFichier[0].message).toEqual("message 1");
    expect(listeErreursValidationFichier[0].numero_de_ligne).toEqual(1);
    expect(listeErreursValidationFichier[0].position_de_ligne).toEqual(0);
    expect(listeErreursValidationFichier[0].nom_du_champ).toEqual(
      "nom du champ 1",
    );
    expect(listeErreursValidationFichier[0].position_du_champ).toEqual(1);

    expect(listeErreursValidationFichier[1].cellule).toEqual("cellule 2");
    expect(listeErreursValidationFichier[1].nom).toEqual("nom 2");
    expect(listeErreursValidationFichier[1].message).toEqual("message 2");
    expect(listeErreursValidationFichier[1].numero_de_ligne).toEqual(2);
    expect(listeErreursValidationFichier[1].position_de_ligne).toEqual(1);
    expect(listeErreursValidationFichier[1].nom_du_champ).toEqual(
      "nom du champ 2",
    );
    expect(listeErreursValidationFichier[1].position_du_champ).toEqual(2);
  });
});
