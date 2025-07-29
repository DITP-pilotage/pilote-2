import { PrismaUtilisateurRepository } from "@/server/chantiers/infrastructure/adapters/PrismaUtilisateurRepository";
import { prisma } from "@/server/db/prisma";

describe("PrismaUtilisateurRepository", () => {
  let prismaUtilisateurRepository: PrismaUtilisateurRepository;

  beforeEach(() => {
    prismaUtilisateurRepository = new PrismaUtilisateurRepository();
  });

  describe("#recupererUtilisateursParProfilEtChantierIds", () => {
    it("doit récupérer tous les utilisateur actifs ayant le profil demandé et les habilitations en lecture sur au moins un chantier de la liste", async () => {
      // Given
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
            chantiers: ["CH-001", "CH-003"],
          },
          {
            utilisateurId: "7056999c-349d-4567-a230-8b0db19c888e",
            scopeCode: "lecture",
            chantiers: ["CH-002"],
          },
          {
            utilisateurId: "eb735d0d-8249-496c-9c54-a2d502405950",
            scopeCode: "lecture",
            chantiers: ["CH-004"],
          },
          {
            utilisateurId: "c57f3b57-f4d7-40e2-81fe-65e27fbd8ad0",
            scopeCode: "lecture",
            chantiers: ["CH-001", "CH-004"],
          },
          {
            utilisateurId: "dce03af2-e6c6-4f9c-8162-6afb98de6318",
            scopeCode: "lecture",
            chantiers: ["CH-001", "CH-003"],
          },
        ],
      });

      // When
      const utilisateurs =
        await prismaUtilisateurRepository.recupererUtilisateursParProfilEtChantierIds(
          "EQUIPE_DIR_PROJET",
          ["CH-001", "CH-004"],
        );
      // Then
      expect(utilisateurs).toHaveLength(2);
      expect(utilisateurs[0].email).toStrictEqual("dir.projet1@test.com");
      expect(utilisateurs[1].email).toStrictEqual("dir.projet3@test.com");
    });
  });
});
