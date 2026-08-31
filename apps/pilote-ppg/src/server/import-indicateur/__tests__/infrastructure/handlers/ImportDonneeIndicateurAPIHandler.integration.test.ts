import { mock } from "vitest-mock-extended";
import PersistentFile from "formidable/PersistentFile";
import { createMocks } from "node-mocks-http";
import { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "node:crypto";
import { DetailValidationFichierBuilder } from "@/server/import-indicateur/app/builder/DetailValidationFichier.builder";
import { ErreurValidationFichierBuilder } from "@/server/import-indicateur/app/builder/ErreurValidationFichier.builder";
import { MesureIndicateurTemporaireBuilder } from "@/server/import-indicateur/app/builder/MesureIndicateurTemporaire.builder";
import UtilisateurÀCréerOuMettreÀJourBuilder from "@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder";
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

function construireRapportErreurs(
  rapportId: string,
): DetailValidationFichierBuilder {
  return new DetailValidationFichierBuilder()
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
    );
}

function construireRapportIndicIdIncoherent(
  rapportId: string,
): DetailValidationFichierBuilder {
  return new DetailValidationFichierBuilder()
    .avecId(rapportId)
    .avecEstValide(true)
    .avecUtilisateurEmail("ditp.admin@example.com")
    .avecListeMesuresIndicateurTemporaire(
      new MesureIndicateurTemporaireBuilder()
        .avecId(randomUUID())
        .avecRapportId(rapportId)
        .avecIndicId("IND-002")
        .avecZoneId("D12")
        .avecMetricDate("2023-03-31")
        .avecMetricType("va")
        .avecMetricValue("9")
        .build(),
      new MesureIndicateurTemporaireBuilder()
        .avecId(randomUUID())
        .avecRapportId(rapportId)
        .avecIndicId("IND-002")
        .avecZoneId("D13")
        .avecMetricDate("2023-01-17")
        .avecMetricType("vc")
        .avecMetricValue("12")
        .build(),
      new MesureIndicateurTemporaireBuilder()
        .avecId(randomUUID())
        .avecRapportId(rapportId)
        .avecIndicId("IND-002")
        .avecZoneId("D14")
        .avecMetricDate("2023-02-26")
        .avecMetricType("vi")
        .avecMetricValue("20")
        .build(),
    );
}

function construireRapportValide(
  rapportId: string,
): DetailValidationFichierBuilder {
  return new DetailValidationFichierBuilder()
    .avecId(rapportId)
    .avecEstValide(true)
    .avecUtilisateurEmail("ditp.admin@example.com")
    .avecListeMesuresIndicateurTemporaire(
      new MesureIndicateurTemporaireBuilder()
        .avecId(randomUUID())
        .avecRapportId(rapportId)
        .avecIndicId("IND-001")
        .avecZoneId("D12")
        .avecMetricDate("2023-03-31")
        .avecMetricType("va")
        .avecMetricValue("9")
        .build(),
      new MesureIndicateurTemporaireBuilder()
        .avecId(randomUUID())
        .avecRapportId(rapportId)
        .avecIndicId("IND-001")
        .avecZoneId("D13")
        .avecMetricDate("2023-01-17")
        .avecMetricType("vc")
        .avecMetricValue("12")
        .build(),
      new MesureIndicateurTemporaireBuilder()
        .avecId(randomUUID())
        .avecRapportId(rapportId)
        .avecIndicId("IND-001")
        .avecZoneId("D14")
        .avecMetricDate("2023-02-26")
        .avecMetricType("vi")
        .avecMetricValue("20")
        .build(),
    );
}

async function creerDonneesPrerequisesPourImportValide() {
  await prisma.chantier_identite.create({
    data: {
      id: "CH-001",
      nom: "Test Chantier",
      est_territorialise: true,
      directeurs_administration_centrale: [],
      directeurs_projet_ids: [],
    },
  });

  await prisma.indicateur_identite.create({
    data: {
      id: "IND-001",
      chantier_id: "CH-001",
      nom: "Test Indicateur",
      type_id: "IMPACT",
    },
  });

  await Promise.all([
    prisma.territoire.upsert({
      where: { code: "DEPT-12" },
      update: {},
      create: {
        code: "DEPT-12",
        nom: "Département 12",
        nom_affiche: "Département 12",
        maille: "DEPT",
        code_insee: "12",
        zone_id: "D12",
      },
    }),
    prisma.territoire.upsert({
      where: { code: "DEPT-13" },
      update: {},
      create: {
        code: "DEPT-13",
        nom: "Département 13",
        nom_affiche: "Département 13",
        maille: "DEPT",
        code_insee: "13",
        zone_id: "D13",
      },
    }),
    prisma.territoire.upsert({
      where: { code: "DEPT-14" },
      update: {},
      create: {
        code: "DEPT-14",
        nom: "Département 14",
        nom_affiche: "Département 14",
        maille: "DEPT",
        code_insee: "14",
        zone_id: "D14",
      },
    }),
  ]);

  await prisma.chantier_territoire.createMany({
    data: [
      {
        id: "CH-001",
        territoire_code: "DEPT-12",
        code_insee: "12",
        zone_id: "D12",
        maille: "DEPT",
      },
      {
        id: "CH-001",
        territoire_code: "DEPT-13",
        code_insee: "13",
        zone_id: "D13",
        maille: "DEPT",
      },
      {
        id: "CH-001",
        territoire_code: "DEPT-14",
        code_insee: "14",
        zone_id: "D14",
        maille: "DEPT",
      },
    ],
  });

  await prisma.indicateur_territoire.createMany({
    data: [
      {
        id: "IND-001",
        chantier_id: "CH-001",
        territoire_code: "DEPT-12",
        code_insee: "12",
        zone_id: "D12",
        maille: "DEPT",
      },
      {
        id: "IND-001",
        chantier_id: "CH-001",
        territoire_code: "DEPT-13",
        code_insee: "13",
        zone_id: "D13",
        maille: "DEPT",
      },
      {
        id: "IND-001",
        chantier_id: "CH-001",
        territoire_code: "DEPT-14",
        code_insee: "14",
        zone_id: "D14",
        maille: "DEPT",
      },
    ],
  });
}

beforeEach(() => {
  validerFichierMock.mockReset();
});

describe("ImportDonneeIndicateurAPIHandler", () => {
  describe("quand on import un fichier via une donnee en JSON", () => {
    it("quand le fichier est invalide a cause de validata, doit remonter les erreurs validata", async () => {
      // Given
      const auteurId = await creeUnUtilisateurEnBase();
      const rapportId = randomUUID();
      validerFichierMock.mockResolvedValue(
        construireRapportErreurs(rapportId).build(),
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
      // Les données sont mockées après dans le retour de validation
      const body = {
        donnees: [],
      };

      const { req: request, res: response } = createMocks<
        NextApiRequest,
        NextApiResponse
      >({
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        query: { indicateurId: "IND-001" },
      });

      request.read = mock<() => string>(() => JSON.stringify(body));

      await getContainer("importIndicateur")
        .resolve("importDonneeIndicateurAPIHandler")
        .handle({
          request,
          response,
          utilisateurId: auteurId,
          email: "ditp.admin@example.com",
          profil: ProfilEnum.DITP_ADMIN,
        });
      // Then
      const data = response._getJSONData();
      expect(response._getStatusCode()).toEqual(400);
      expect(data.message).toEqual(
        "Une erreur est survenue lors de l'import des données",
      );
      expect(data.erreurs[0].cellule).toEqual("cellule 1");
      expect(data.erreurs[0].nomDuChamp).toEqual("nom du champ 1");
      expect(data.erreurs[0].message).toEqual("message 1");

      expect(data.erreurs[1].cellule).toEqual("cellule 2");
      expect(data.erreurs[1].nomDuChamp).toEqual("nom du champ 2");
      expect(data.erreurs[1].message).toEqual("message 2");
    });

    it("quand le fichier est invalide a cause de validata, doit sauvegarder les erreurs validata", async () => {
      // Given
      const auteurId = await creeUnUtilisateurEnBase();
      const rapportId = randomUUID();
      validerFichierMock.mockResolvedValue(
        construireRapportErreurs(rapportId).build(),
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
      // Les données sont mockées après dans le retour de validation
      const body = {
        donnees: [],
      };

      const { req: request, res: response } = createMocks<
        NextApiRequest,
        NextApiResponse
      >({
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        query: { indicateurId: "IND-001" },
      });

      request.read = mock<() => string>(() => JSON.stringify(body));

      await getContainer("importIndicateur")
        .resolve("importDonneeIndicateurAPIHandler")
        .handle({
          request,
          response,
          utilisateurId: auteurId,
          email: "ditp.admin@example.com",
          profil: ProfilEnum.DITP_ADMIN,
        });

      // Then
      expect(response._getStatusCode()).toEqual(400);
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

    it("quand le fichier est invalide a cause de règle DITP <<indic_id request different des indic_id dans fichier>>, doit sauvegarder les erreurs", async () => {
      // Given
      const auteurId = await creeUnUtilisateurEnBase();
      const rapportId = randomUUID();
      validerFichierMock.mockResolvedValue(
        construireRapportIndicIdIncoherent(rapportId).build(),
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
      // Les données sont mockées après dans le retour de validation
      const body = {
        donnees: [],
      };

      const { req: request, res: response } = createMocks<
        NextApiRequest,
        NextApiResponse
      >({
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        query: { indicateurId: "IND-001" },
      });

      request.read = mock<() => string>(() => JSON.stringify(body));

      await getContainer("importIndicateur")
        .resolve("importDonneeIndicateurAPIHandler")
        .handle({
          request,
          response,
          utilisateurId: auteurId,
          email: "ditp.admin@example.com",
          profil: ProfilEnum.DITP_ADMIN,
        });

      // Then
      expect(response._getStatusCode()).toEqual(400);
      const listeErreursValidationFichier =
        await prisma.erreur_validation_fichier.findMany();
      expect(listeErreursValidationFichier[0].cellule).toEqual("IND-002");
      expect(listeErreursValidationFichier[0].nom).toEqual(
        "Indicateur invalide",
      );
      expect(listeErreursValidationFichier[0].message).toEqual(
        "L'indicateur IND-002 ne correpond pas à l'indicateur choisis (IND-001)",
      );
      expect(listeErreursValidationFichier[0].nom_du_champ).toEqual("indic_id");

      expect(listeErreursValidationFichier[1].cellule).toEqual("IND-002");
      expect(listeErreursValidationFichier[1].nom).toEqual(
        "Indicateur invalide",
      );
      expect(listeErreursValidationFichier[1].message).toEqual(
        "L'indicateur IND-002 ne correpond pas à l'indicateur choisis (IND-001)",
      );
      expect(listeErreursValidationFichier[1].nom_du_champ).toEqual("indic_id");

      expect(listeErreursValidationFichier[2].cellule).toEqual("IND-002");
      expect(listeErreursValidationFichier[2].nom).toEqual(
        "Indicateur invalide",
      );
      expect(listeErreursValidationFichier[2].message).toEqual(
        "L'indicateur IND-002 ne correpond pas à l'indicateur choisis (IND-001)",
      );
      expect(listeErreursValidationFichier[2].nom_du_champ).toEqual("indic_id");
    });

    it("quand le fichier est valide, doit importer les données", async () => {
      // Given
      const auteurId = await creeUnUtilisateurEnBase();

      // Create prerequisite data for foreign key constraints
      await creerDonneesPrerequisesPourImportValide();

      const rapportId = randomUUID();
      validerFichierMock.mockResolvedValue(
        construireRapportValide(rapportId).build(),
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
      // Les données sont mockées après dans le retour de validation
      const body = {
        donnees: [],
      };

      const { req: request, res: response } = createMocks<
        NextApiRequest,
        NextApiResponse
      >({
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        query: { indicateurId: "IND-001" },
      });

      request.read = mock<() => string>(() => JSON.stringify(body));

      await getContainer("importIndicateur")
        .resolve("importDonneeIndicateurAPIHandler")
        .handle({
          request,
          response,
          utilisateurId: auteurId,
          email: "ditp.admin@example.com",
          profil: ProfilEnum.DITP_ADMIN,
        });
      // Then
      expect(response._getStatusCode()).toEqual(200);
      expect(response._getJSONData().message).toEqual(
        "Les données ont correctement été importés",
      );
      const listeMesuresIndicateursTemporaire =
        await prisma.mesure_indicateur_temporaire.findMany({});
      const listeMesuresIndicateurs = await prisma.mesure_indicateur.findMany(
        {},
      );

      expect(listeMesuresIndicateursTemporaire).toHaveLength(0);

      expect(listeMesuresIndicateurs).toHaveLength(3);
      expect(listeMesuresIndicateurs.at(0)?.indic_id).toEqual("IND-001");
      expect(listeMesuresIndicateurs.at(1)?.indic_id).toEqual("IND-001");
      expect(listeMesuresIndicateurs.at(2)?.indic_id).toEqual("IND-001");
    });
  });

  describe("quand on import un fichier via une donnee en CSV", () => {
    it("quand le fichier est invalide a cause de validata, doit remonter les erreurs validata", async () => {
      // Given
      const auteurId = await creeUnUtilisateurEnBase();
      const rapportId = randomUUID();
      validerFichierMock.mockResolvedValue(
        construireRapportErreurs(rapportId).build(),
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
      const formData = new FormData();
      const file = mock<File>();
      formData.append("file", file);

      const { req: request, res: response } = createMocks<
        NextApiRequest,
        NextApiResponse
      >({
        method: "POST",
        body: formData,
        headers: {
          "content-type": "multipart/form-data",
        },
        query: { indicateurId: "IND-001" },
      });

      await getContainer("importIndicateur")
        .resolve("importDonneeIndicateurAPIHandler")
        .handle({
          request,
          response,
          utilisateurId: auteurId,
          email: "ditp.admin@example.com",
          profil: ProfilEnum.DITP_ADMIN,
        });
      // Then
      const data = response._getJSONData();
      expect(response._getStatusCode()).toEqual(400);
      expect(data.message).toEqual(
        "Une erreur est survenue lors de l'import des données",
      );
      expect(data.erreurs[0].cellule).toEqual("cellule 1");
      expect(data.erreurs[0].nomDuChamp).toEqual("nom du champ 1");
      expect(data.erreurs[0].message).toEqual("message 1");

      expect(data.erreurs[1].cellule).toEqual("cellule 2");
      expect(data.erreurs[1].nomDuChamp).toEqual("nom du champ 2");
      expect(data.erreurs[1].message).toEqual("message 2");
    });

    it("quand le fichier est invalide a cause de validata, doit sauvegarder les erreurs validata", async () => {
      // Given
      const auteurId = await creeUnUtilisateurEnBase();
      const rapportId = randomUUID();
      validerFichierMock.mockResolvedValue(
        construireRapportErreurs(rapportId).build(),
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
      const formData = new FormData();
      const file = mock<File>();
      formData.append("file", file);

      const { req: request, res: response } = createMocks<
        NextApiRequest,
        NextApiResponse
      >({
        method: "POST",
        body: formData,
        headers: {
          "content-type": "multipart/form-data",
        },
        query: { indicateurId: "IND-001" },
      });

      await getContainer("importIndicateur")
        .resolve("importDonneeIndicateurAPIHandler")
        .handle({
          request,
          response,
          utilisateurId: auteurId,
          email: "ditp.admin@example.com",
          profil: ProfilEnum.DITP_ADMIN,
        });
      // Then
      expect(response._getStatusCode()).toEqual(400);
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

    it("quand le fichier est invalide a cause de règle DITP <<indic_id request different des indic_id dans fichier>>, doit sauvegarder les erreurs", async () => {
      // Given
      const auteurId = await creeUnUtilisateurEnBase();
      const rapportId = randomUUID();
      validerFichierMock.mockResolvedValue(
        construireRapportIndicIdIncoherent(rapportId).build(),
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
      const formData = new FormData();
      const file = mock<File>();
      formData.append("file", file);

      const { req: request, res: response } = createMocks<
        NextApiRequest,
        NextApiResponse
      >({
        method: "POST",
        body: formData,
        headers: {
          "content-type": "multipart/form-data",
        },
        query: { indicateurId: "IND-001" },
      });

      await getContainer("importIndicateur")
        .resolve("importDonneeIndicateurAPIHandler")
        .handle({
          request,
          response,
          utilisateurId: auteurId,
          email: "ditp.admin@example.com",
          profil: ProfilEnum.DITP_ADMIN,
        });
      // Then
      expect(response._getStatusCode()).toEqual(400);
      const listeErreursValidationFichier =
        await prisma.erreur_validation_fichier.findMany();
      expect(listeErreursValidationFichier[0].cellule).toEqual("IND-002");
      expect(listeErreursValidationFichier[0].nom).toEqual(
        "Indicateur invalide",
      );
      expect(listeErreursValidationFichier[0].message).toEqual(
        "L'indicateur IND-002 ne correpond pas à l'indicateur choisis (IND-001)",
      );
      expect(listeErreursValidationFichier[0].nom_du_champ).toEqual("indic_id");

      expect(listeErreursValidationFichier[1].cellule).toEqual("IND-002");
      expect(listeErreursValidationFichier[1].nom).toEqual(
        "Indicateur invalide",
      );
      expect(listeErreursValidationFichier[1].message).toEqual(
        "L'indicateur IND-002 ne correpond pas à l'indicateur choisis (IND-001)",
      );
      expect(listeErreursValidationFichier[1].nom_du_champ).toEqual("indic_id");

      expect(listeErreursValidationFichier[2].cellule).toEqual("IND-002");
      expect(listeErreursValidationFichier[2].nom).toEqual(
        "Indicateur invalide",
      );
      expect(listeErreursValidationFichier[2].message).toEqual(
        "L'indicateur IND-002 ne correpond pas à l'indicateur choisis (IND-001)",
      );
      expect(listeErreursValidationFichier[2].nom_du_champ).toEqual("indic_id");
    });

    it("quand le fichier est valide, doit importer les données", async () => {
      // Given
      const auteurId = await creeUnUtilisateurEnBase();

      // Create prerequisite data for foreign key constraints
      await creerDonneesPrerequisesPourImportValide();

      const rapportId = randomUUID();
      validerFichierMock.mockResolvedValue(
        construireRapportValide(rapportId).build(),
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
      const formData = new FormData();
      const file = mock<File>();
      formData.append("file", file);

      const { req: request, res: response } = createMocks<
        NextApiRequest,
        NextApiResponse
      >({
        method: "POST",
        body: formData,
        headers: {
          "content-type": "multipart/form-data",
        },
        query: { indicateurId: "IND-001" },
      });
      await getContainer("importIndicateur")
        .resolve("importDonneeIndicateurAPIHandler")
        .handle({
          request,
          response,
          utilisateurId: auteurId,
          email: "ditp.admin@example.com",
          profil: ProfilEnum.DITP_ADMIN,
        });
      // Then
      expect(response._getStatusCode()).toEqual(200);
      expect(response._getJSONData().message).toEqual(
        "Les données ont correctement été importés",
      );

      const listeMesuresIndicateursTemporaire =
        await prisma.mesure_indicateur_temporaire.findMany({});
      const listeMesuresIndicateurs = await prisma.mesure_indicateur.findMany(
        {},
      );

      expect(listeMesuresIndicateursTemporaire).toHaveLength(0);

      expect(listeMesuresIndicateurs).toHaveLength(3);
      expect(listeMesuresIndicateurs.at(0)?.indic_id).toEqual("IND-001");
      expect(listeMesuresIndicateurs.at(1)?.indic_id).toEqual("IND-001");
      expect(listeMesuresIndicateurs.at(2)?.indic_id).toEqual("IND-001");
    });
  });
});
