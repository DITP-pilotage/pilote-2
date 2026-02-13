import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { AjouterLesChantierAuxHabilitationsHandler } from "@/server/habilitations-coordinateur/handlers/AjouterLesChantierAuxHabilitationsHandler";

describe("AjouterLesChantierAuxHabilitationsHandler", () => {
  let handler: AjouterLesChantierAuxHabilitationsHandler;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    handler = new AjouterLesChantierAuxHabilitationsHandler({
      prisma: prismaPilote,
    });
  });

  describe("execute", () => {
    it(
      "ajoute les chantiers aux habilitations existantes des coordinateurs REG et DEPT",
      createIntegrationTest(async (prisma) => {
        // given
        await fixtures.chantierIdentite({
          id: "CH-001",
          est_territorialise: true,
          statut: "PUBLIE",
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-11",
          est_applicable: true,
        });

        await fixtures.chantierIdentite({
          id: "CH-002",
          est_territorialise: true,
          statut: "PUBLIE",
        });
        await fixtures.chantierTerritoire({
          id: "CH-002",
          territoire_code: "DEPT-75",
          est_applicable: true,
        });

        const coordinateurRegion = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        });
        await fixtures.habilitation({
          utilisateurId: coordinateurRegion.id,
          scopeCode: "saisieCommentaire",
          chantiers: [],
          territoires: ["REG-11", "DEPT-75"],
        });

        const coordinateurDepartement = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_DEPARTEMENT",
        });
        await fixtures.habilitation({
          utilisateurId: coordinateurDepartement.id,
          scopeCode: "saisieCommentaire",
          chantiers: [],
          territoires: ["DEPT-75"],
        });

        // when
        await handler.execute({
          chantierIds: ["CH-001", "CH-002"],
          scope: "saisieCommentaire",
        });

        // then
        const habilitationRegion = await prisma.habilitation.findUnique({
          where: {
            utilisateurId_scopeCode: {
              utilisateurId: coordinateurRegion.id,
              scopeCode: "saisieCommentaire",
            },
          },
        });
        const habilitationDepartement = await prisma.habilitation.findUnique({
          where: {
            utilisateurId_scopeCode: {
              utilisateurId: coordinateurDepartement.id,
              scopeCode: "saisieCommentaire",
            },
          },
        });

        expect(habilitationRegion?.chantiers).toEqual(
          expect.arrayContaining(["CH-001", "CH-002"]),
        );
        expect(habilitationDepartement?.chantiers).toEqual(
          expect.arrayContaining(["CH-002"]),
        );
      }),
    );

    it(
      "ajoute les chantier IDs sans doublons",
      createIntegrationTest(async (prisma) => {
        // given
        await fixtures.chantierIdentite({
          id: "CH-001",
          est_territorialise: true,
          statut: "PUBLIE",
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-11",
          est_applicable: true,
        });

        await fixtures.chantierIdentite({
          id: "CH-002",
          est_territorialise: true,
          statut: "PUBLIE",
        });
        await fixtures.chantierTerritoire({
          id: "CH-002",
          territoire_code: "REG-11",
          est_applicable: true,
        });

        const coordinateur = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        });
        await fixtures.habilitation({
          utilisateurId: coordinateur.id,
          scopeCode: "saisieCommentaire",
          chantiers: ["CH-001"],
          territoires: ["REG-11"],
        });

        // when
        await handler.execute({
          chantierIds: ["CH-001", "CH-002"],
          scope: "saisieCommentaire",
        });

        // then
        const habilitation = await prisma.habilitation.findUnique({
          where: {
            utilisateurId_scopeCode: {
              utilisateurId: coordinateur.id,
              scopeCode: "saisieCommentaire",
            },
          },
        });

        expect(habilitation?.chantiers).toEqual(
          expect.arrayContaining(["CH-001", "CH-002"]),
        );
        expect(habilitation?.chantiers).toHaveLength(2);
      }),
    );

    it(
      "ne cible que les profils coordinateurs",
      createIntegrationTest(async (prisma) => {
        // given
        await fixtures.chantierIdentite({
          id: "CH-001",
          est_territorialise: true,
          statut: "PUBLIE",
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-11",
          est_applicable: true,
        });

        const coordinateur = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        });
        await fixtures.habilitation({
          utilisateurId: coordinateur.id,
          scopeCode: "saisieCommentaire",
          chantiers: [],
          territoires: ["REG-11"],
        });

        const admin = await fixtures.utilisateur({
          profilCode: "DITP_ADMIN",
        });
        await fixtures.habilitation({
          utilisateurId: admin.id,
          scopeCode: "saisieCommentaire",
          chantiers: [],
          territoires: ["REG-11"],
        });

        // when
        await handler.execute({
          chantierIds: ["CH-001"],
          scope: "saisieCommentaire",
        });

        // then
        const habilitationCoordinateur = await prisma.habilitation.findUnique({
          where: {
            utilisateurId_scopeCode: {
              utilisateurId: coordinateur.id,
              scopeCode: "saisieCommentaire",
            },
          },
        });
        const habilitationAdmin = await prisma.habilitation.findUnique({
          where: {
            utilisateurId_scopeCode: {
              utilisateurId: admin.id,
              scopeCode: "saisieCommentaire",
            },
          },
        });

        expect(habilitationCoordinateur?.chantiers).toEqual(["CH-001"]);
        expect(habilitationAdmin?.chantiers).toEqual([]);
      }),
    );

    it(
      "ne modifie pas les habilitations des autres scopes",
      createIntegrationTest(async (prisma) => {
        // given
        await fixtures.chantierIdentite({
          id: "CH-001",
          est_territorialise: true,
          statut: "PUBLIE",
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-11",
          est_applicable: true,
        });

        const coordinateur = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        });
        await fixtures.habilitation({
          utilisateurId: coordinateur.id,
          scopeCode: "lecture",
          chantiers: ["CH-EXISTANT"],
          territoires: ["REG-11"],
        });
        await fixtures.habilitation({
          utilisateurId: coordinateur.id,
          scopeCode: "gestionUtilisateur",
          chantiers: [],
          territoires: ["REG-11"],
        });

        // when
        await handler.execute({
          chantierIds: ["CH-001"],
          scope: "gestionUtilisateur",
        });

        // then
        const habilitationLecture = await prisma.habilitation.findUnique({
          where: {
            utilisateurId_scopeCode: {
              utilisateurId: coordinateur.id,
              scopeCode: "lecture",
            },
          },
        });

        expect(habilitationLecture?.chantiers).toEqual(["CH-EXISTANT"]);
      }),
    );

    it(
      "préserve les territoires et périmètres existants lors de la mise à jour",
      createIntegrationTest(async (prisma) => {
        // given
        await fixtures.chantierIdentite({
          id: "CH-001",
          est_territorialise: true,
          statut: "PUBLIE",
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-11",
          est_applicable: true,
        });

        const coordinateur = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        });
        await fixtures.habilitation({
          utilisateurId: coordinateur.id,
          scopeCode: "saisieCommentaire",
          chantiers: ["CH-EXISTANT"],
          territoires: ["REG-11"],
          perimetres: ["PER-01"],
        });

        // when
        await handler.execute({
          chantierIds: ["CH-001"],
          scope: "saisieCommentaire",
        });

        // then
        const habilitation = await prisma.habilitation.findUnique({
          where: {
            utilisateurId_scopeCode: {
              utilisateurId: coordinateur.id,
              scopeCode: "saisieCommentaire",
            },
          },
        });

        expect(habilitation?.territoires).toEqual(["REG-11"]);
        expect(habilitation?.perimetres).toEqual(["PER-01"]);
      }),
    );

    it(
      "n'ajoute pas le chantier si le coordinateur n'a aucun territoire applicable dans ses habilitations",
      createIntegrationTest(async (prisma) => {
        // given
        await fixtures.chantierIdentite({
          id: "CH-001",
          est_territorialise: true,
          statut: "PUBLIE",
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-11",
          est_applicable: true,
        });

        const coordinateur = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        });
        await fixtures.habilitation({
          utilisateurId: coordinateur.id,
          scopeCode: "saisieCommentaire",
          chantiers: [],
          // REG-84 ne fait pas partie des territoires applicables de CH-001
          territoires: ["REG-84"],
        });

        // when
        await handler.execute({
          chantierIds: ["CH-001"],
          scope: "saisieCommentaire",
        });

        // then
        const habilitation = await prisma.habilitation.findUnique({
          where: {
            utilisateurId_scopeCode: {
              utilisateurId: coordinateur.id,
              scopeCode: "saisieCommentaire",
            },
          },
        });

        expect(habilitation?.chantiers).toEqual([]);
      }),
    );

    it(
      "ajoute uniquement les chantiers dont au moins un territoire applicable matche",
      createIntegrationTest(async (prisma) => {
        // given
        await fixtures.chantierIdentite({
          id: "CH-001",
          est_territorialise: true,
          statut: "PUBLIE",
        });
        await fixtures.chantierTerritoire({
          id: "CH-001",
          territoire_code: "REG-11",
          est_applicable: true,
        });

        await fixtures.chantierIdentite({
          id: "CH-002",
          est_territorialise: true,
          statut: "PUBLIE",
        });
        await fixtures.chantierTerritoire({
          id: "CH-002",
          territoire_code: "REG-84",
          est_applicable: true,
        });

        const coordinateur = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        });
        await fixtures.habilitation({
          utilisateurId: coordinateur.id,
          scopeCode: "saisieCommentaire",
          chantiers: [],
          // match uniquement CH-001 (REG-11), pas CH-002 (REG-84)
          territoires: ["REG-11"],
        });

        // when
        await handler.execute({
          chantierIds: ["CH-001", "CH-002"],
          scope: "saisieCommentaire",
        });

        // then
        const habilitation = await prisma.habilitation.findUnique({
          where: {
            utilisateurId_scopeCode: {
              utilisateurId: coordinateur.id,
              scopeCode: "saisieCommentaire",
            },
          },
        });

        expect(habilitation?.chantiers).toEqual(["CH-001"]);
      }),
    );
  });
});
