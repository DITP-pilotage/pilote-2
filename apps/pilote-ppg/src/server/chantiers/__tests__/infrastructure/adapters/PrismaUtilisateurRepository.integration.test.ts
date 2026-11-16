import { randomUUID } from "node:crypto";
import { PrismaUtilisateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaUtilisateurRepository";
import { prisma } from "@/server/framework/persistence/prisma";
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";

describe("PrismaUtilisateurRepository", () => {
  let prismaUtilisateurRepository: PrismaUtilisateurRepository;

  beforeEach(() => {
    prismaUtilisateurRepository = new PrismaUtilisateurRepository();
  });

  describe("#recupererUtilisateursParProfilEtChantierIds", () => {
    it(
      "doit récupérer tous les utilisateur actifs ayant le profil demandé et les habilitations en lecture sur au moins un chantier de la liste",
      createIntegrationTest(async () => {
        // Given
        const chantierId1 = randomUUID();
        const chantierId2 = randomUUID();
        const chantierId3 = randomUUID();
        const chantierId4 = randomUUID();

        await prisma.utilisateur.createMany({
          data: [
            {
              id: "d1e776ad-af24-4320-bef9-7367d0373cad",
              email: "dir.projet1@test.com",
              nom: "projet1",
              prenom: "dir",
              profilCode: "EQUIPE_DIR_PROJET",
              date_creation: new Date(),
            },
            {
              id: "7056999c-349d-4567-a230-8b0db19c888e",
              email: "dir.projet2@test.com",
              nom: "projet2",
              prenom: "dir",
              profilCode: "EQUIPE_DIR_PROJET",
              date_creation: new Date(),
            },
            {
              id: "eb735d0d-8249-496c-9c54-a2d502405950",
              email: "dir.projet3@test.com",
              nom: "projet3",
              prenom: "dir",
              profilCode: "EQUIPE_DIR_PROJET",
              date_creation: new Date(),
            },
            {
              id: "c57f3b57-f4d7-40e2-81fe-65e27fbd8ad0",
              email: "coord.region@test.com",
              nom: "regio",
              prenom: "coord",
              profilCode: "COORDINATEUR_REGION",
              date_creation: new Date(),
            },
            {
              id: "dce03af2-e6c6-4f9c-8162-6afb98de6318",
              email: "dir.projet.desactive@test.com",
              nom: "desactive",
              prenom: "dir",
              profilCode: "EQUIPE_DIR_PROJET",
              date_creation: new Date(),
              date_desactivation: new Date(),
            },
          ],
        });

        await prisma.habilitation.createMany({
          data: [
            {
              utilisateurId: "d1e776ad-af24-4320-bef9-7367d0373cad",
              scopeCode: "lecture",
              chantiers: [chantierId1, chantierId3],
            },
            {
              utilisateurId: "7056999c-349d-4567-a230-8b0db19c888e",
              scopeCode: "lecture",
              chantiers: [chantierId2],
            },
            {
              utilisateurId: "eb735d0d-8249-496c-9c54-a2d502405950",
              scopeCode: "lecture",
              chantiers: [chantierId4],
            },
            {
              utilisateurId: "c57f3b57-f4d7-40e2-81fe-65e27fbd8ad0",
              scopeCode: "lecture",
              chantiers: [chantierId1, chantierId4],
            },
            {
              utilisateurId: "dce03af2-e6c6-4f9c-8162-6afb98de6318",
              scopeCode: "lecture",
              chantiers: [chantierId1, chantierId3],
            },
          ],
        });

        // When
        const utilisateurs =
          await prismaUtilisateurRepository.recupererUtilisateursParProfilEtChantierIds(
            ["EQUIPE_DIR_PROJET"],
            [chantierId1, chantierId4],
          );
        // Then
        expect(utilisateurs).toHaveLength(2);
        expect(utilisateurs[0].email).toStrictEqual("dir.projet1@test.com");
        expect(utilisateurs[1].email).toStrictEqual("dir.projet3@test.com");
      }),
    );

    it(
      "doit récupérer les utilisateurs ayant des habilitations via périmètres",
      createIntegrationTest(async () => {
        // Given
        const chantier100 = await fixtures.chantierIdentite({
          nom: "Chantier 100",
          perimetre_ids: ["PER-001", "PER-002"],
          statut: "PUBLIE",
        });
        const chantier101 = await fixtures.chantierIdentite({
          nom: "Chantier 101",
          perimetre_ids: ["PER-002"],
          statut: "PUBLIE",
        });
        await fixtures.chantierIdentite({
          nom: "Chantier 102",
          perimetre_ids: ["PER-003"],
          statut: "PUBLIE",
        });

        await prisma.utilisateur.createMany({
          data: [
            {
              id: "a1b2c3d4-1111-2222-3333-444444444444",
              email: "user.perimetre1@test.com",
              nom: "Perimetre1",
              prenom: "User",
              profilCode: "EQUIPE_DIR_PROJET",
              date_creation: new Date(),
            },
            {
              id: "a1b2c3d4-5555-6666-7777-888888888888",
              email: "user.perimetre2@test.com",
              nom: "Perimetre2",
              prenom: "User",
              profilCode: "EQUIPE_DIR_PROJET",
              date_creation: new Date(),
            },
          ],
        });

        await prisma.habilitation.createMany({
          data: [
            {
              utilisateurId: "a1b2c3d4-1111-2222-3333-444444444444",
              scopeCode: "lecture",
              perimetres: ["PER-001"],
            },
            {
              utilisateurId: "a1b2c3d4-5555-6666-7777-888888888888",
              scopeCode: "lecture",
              perimetres: ["PER-002"],
            },
          ],
        });

        // When
        const utilisateurs =
          await prismaUtilisateurRepository.recupererUtilisateursParProfilEtChantierIds(
            ["EQUIPE_DIR_PROJET"],
            [chantier100.id, chantier101.id],
          );

        // Then
        expect(utilisateurs).toIncludeSameMembers([
          expect.objectContaining({
            email: "user.perimetre1@test.com",
            listeChantiers: [chantier100.id],
          }),
          expect.objectContaining({
            email: "user.perimetre2@test.com",
            listeChantiers: expect.toIncludeSameMembers([
              chantier100.id,
              chantier101.id,
            ]),
          }),
        ]);
      }),
    );

    it(
      "doit récupérer les utilisateurs ayant des habilitations directes et via périmètres",
      createIntegrationTest(async () => {
        // Given
        const chantier200 = await fixtures.chantierIdentite({
          nom: "Chantier 200",
          perimetre_ids: ["PER-100"],
          statut: "PUBLIE",
        });
        const chantier201 = await fixtures.chantierIdentite({
          nom: "Chantier 201",
          perimetre_ids: ["PER-100"],
          statut: "PUBLIE",
        });
        const chantier202 = await fixtures.chantierIdentite({
          nom: "Chantier 202",
          perimetre_ids: [],
          statut: "PUBLIE",
        });

        await prisma.utilisateur.create({
          data: {
            id: "b1b2b3b4-1111-2222-3333-444444444444",
            email: "user.mixte@test.com",
            nom: "Mixte",
            prenom: "User",
            profilCode: "EQUIPE_DIR_PROJET",
            date_creation: new Date(),
          },
        });

        await prisma.habilitation.create({
          data: {
            utilisateurId: "b1b2b3b4-1111-2222-3333-444444444444",
            scopeCode: "lecture",
            chantiers: [chantier202.id],
            perimetres: ["PER-100"],
          },
        });

        // When
        const utilisateurs =
          await prismaUtilisateurRepository.recupererUtilisateursParProfilEtChantierIds(
            ["EQUIPE_DIR_PROJET"],
            [chantier200.id, chantier201.id, chantier202.id],
          );

        // Then
        expect(utilisateurs).toEqual([
          expect.objectContaining({
            email: "user.mixte@test.com",
            listeChantiers: expect.toIncludeSameMembers([
              chantier202.id,
              chantier200.id,
              chantier201.id,
            ]),
          }),
        ]);
      }),
    );

    it(
      "doit récupérer les utilisateurs de plusieurs profils en même temps",
      createIntegrationTest(async () => {
        // Given
        const chantierId = randomUUID();

        await prisma.utilisateur.createMany({
          data: [
            {
              id: "a3f1e2d4-0001-4000-8000-000000000001",
              email: "dir.projet.mp@test.com",
              nom: "Projet",
              prenom: "Dir",
              profilCode: "EQUIPE_DIR_PROJET",
              date_creation: new Date(),
            },
            {
              id: "a3f1e2d4-0002-4000-8000-000000000002",
              email: "sec.general.mp@test.com",
              nom: "General",
              prenom: "Sec",
              profilCode: "SECRETARIAT_GENERAL",
              date_creation: new Date(),
            },
            {
              id: "a3f1e2d4-0003-4000-8000-000000000003",
              email: "coord.region.mp@test.com",
              nom: "Region",
              prenom: "Coord",
              profilCode: "COORDINATEUR_REGION",
              date_creation: new Date(),
            },
          ],
        });

        await prisma.habilitation.createMany({
          data: [
            {
              utilisateurId: "a3f1e2d4-0001-4000-8000-000000000001",
              scopeCode: "lecture",
              chantiers: [chantierId],
            },
            {
              utilisateurId: "a3f1e2d4-0002-4000-8000-000000000002",
              scopeCode: "lecture",
              chantiers: [chantierId],
            },
            {
              utilisateurId: "a3f1e2d4-0003-4000-8000-000000000003",
              scopeCode: "lecture",
              chantiers: [chantierId],
            },
          ],
        });

        // When
        const utilisateurs =
          await prismaUtilisateurRepository.recupererUtilisateursParProfilEtChantierIds(
            ["EQUIPE_DIR_PROJET", "SECRETARIAT_GENERAL"],
            [chantierId],
          );

        // Then
        expect(utilisateurs).toHaveLength(2);
        expect(utilisateurs).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ email: "dir.projet.mp@test.com" }),
            expect.objectContaining({ email: "sec.general.mp@test.com" }),
          ]),
        );
      }),
    );

    it(
      "ne doit pas récupérer les utilisateurs ayant uniquement des périmètres sans chantiers correspondants",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite({
          nom: "Chantier 300",
          perimetre_ids: ["PER-200"],
          statut: "PUBLIE",
        });

        await prisma.utilisateur.create({
          data: {
            id: "c1c2c3c4-1111-2222-3333-444444444444",
            email: "user.sans.chantier@test.com",
            nom: "SansChantier",
            prenom: "User",
            profilCode: "EQUIPE_DIR_PROJET",
            date_creation: new Date(),
          },
        });

        await prisma.habilitation.create({
          data: {
            utilisateurId: "c1c2c3c4-1111-2222-3333-444444444444",
            scopeCode: "lecture",
            perimetres: ["PER-999"],
          },
        });

        // When
        const utilisateurs =
          await prismaUtilisateurRepository.recupererUtilisateursParProfilEtChantierIds(
            ["EQUIPE_DIR_PROJET"],
            [chantier.id],
          );

        // Then
        expect(utilisateurs).toHaveLength(0);
      }),
    );
  });

  describe("#recupererParIds", () => {
    it(
      "ignore les identifiants qui ne sont pas des UUID au lieu de faire échouer la requête",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          prenom: "Léa",
          nom: "Martin",
        });

        // When
        const utilisateurParId =
          await prismaUtilisateurRepository.recupererParIds([
            utilisateur.id,
            "pas-un-uuid",
            "",
          ]);

        // Then
        expect([...utilisateurParId.keys()]).toEqual([utilisateur.id]);
      }),
    );
  });
});
