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
        const coordinateurRegion = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        });
        await fixtures.habilitation({
          utilisateurId: coordinateurRegion.id,
          scopeCode: "saisieCommentaire",
          chantiers: [],
        });

        const coordinateurDepartement = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_DEPARTEMENT",
        });
        await fixtures.habilitation({
          utilisateurId: coordinateurDepartement.id,
          scopeCode: "saisieCommentaire",
          chantiers: [],
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
          expect.arrayContaining(["CH-001", "CH-002"]),
        );
      }),
    );

    it(
      "ajoute les chantier IDs sans doublons",
      createIntegrationTest(async (prisma) => {
        // given
        const coordinateur = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        });
        await fixtures.habilitation({
          utilisateurId: coordinateur.id,
          scopeCode: "saisieCommentaire",
          chantiers: ["CH-001"],
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
        const coordinateur = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        });
        await fixtures.habilitation({
          utilisateurId: coordinateur.id,
          scopeCode: "saisieCommentaire",
          chantiers: [],
        });

        const admin = await fixtures.utilisateur({
          profilCode: "DITP_ADMIN",
        });
        await fixtures.habilitation({
          utilisateurId: admin.id,
          scopeCode: "saisieCommentaire",
          chantiers: [],
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
        const coordinateur = await fixtures.utilisateur({
          profilCode: "COORDINATEUR_REGION",
        });
        await fixtures.habilitation({
          utilisateurId: coordinateur.id,
          scopeCode: "lecture",
          chantiers: ["CH-EXISTANT"],
        });
        await fixtures.habilitation({
          utilisateurId: coordinateur.id,
          scopeCode: "gestionUtilisateur",
          chantiers: [],
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
  });
});
