import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { prisma } from "@/server/db/prisma";
import { PrismaCommentaireRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaCommentaireRepository";

describe("PrismaCommentaireRepository", () => {
  let prismaCommentaireRepository: PrismaCommentaireRepository;

  beforeEach(() => {
    prismaCommentaireRepository = new PrismaCommentaireRepository();
  });
  describe("#anonymiserAuteurs", () => {
    test("doit anonymiser l'auteur des commentaires saisis par l'utilisateur supprimé", async () => {
      // Given
      const auteurId1 = "f62765e6-0d66-4cfa-af41-6ec9b3ded48c";
      const auteurId2 = "3150e759-3551-4ff7-9ba1-c8e119f49f3b";
      const auteurId3 = "4421e6d7-980b-4ea9-ab66-95d4c2b62a6c";

      await prisma.chantier_identite.create({
        data: {
          id: "CH-001",
          nom: "Chantier 001",
        },
      });
      await prisma.chantier_territoire.create({
        data: {
          id: "CH-001",
          zone_id: "FRANCE",
          maille: "NAT",
          code_insee: "FR",
          territoire_code: "NAT-FR",
        },
      });

      await prisma.utilisateur.createMany({
        data: [
          {
            id: auteurId1,
            email: "john.doe@test.com",
            nom: "doe",
            prenom: "john",
            date_creation: new Date().toISOString(),
            profilCode: ProfilEnum.DITP_ADMIN,
          },
          {
            id: auteurId2,
            email: "auteur.commentaire@test.com",
            nom: "commentaire",
            prenom: "auteur",
            date_creation: new Date().toISOString(),
            profilCode: ProfilEnum.DITP_ADMIN,
          },
          {
            id: auteurId3,
            email: "utilisateur.supprime@modernisation.gouv.fr",
            nom: "inconnu",
            prenom: "auteur",
            date_creation: new Date().toISOString(),
            profilCode: ProfilEnum.DITP_ADMIN,
          },
        ],
      });

      await prisma.commentaire.createMany({
        data: [
          {
            id: "77053976-1a8e-49f0-b68a-df01da2fc277",
            chantier_id: "CH-001",
            auteur_id: auteurId1,
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            type: "commentaires_sur_les_donnees",
            date: new Date("2023-04-20"),
            contenu: "commentaire risquesEtFreinsÀLever",
          },
          {
            id: "b699907e-43c4-43be-8d8d-185fca1b2e50",
            chantier_id: "CH-001",
            auteur_id: auteurId2,
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            type: "commentaires_sur_les_donnees",
            date: new Date("2024-04-20"),
            contenu: "commentaire risquesEtFreinsÀLever",
          },
          {
            id: "e3885e40-caab-4fb6-acf4-0c8f66c9e290",
            chantier_id: "CH-001",
            auteur_id: auteurId2,
            maille: "NAT",
            code_insee: "FR",
            territoire_code: "NAT-FR",
            type: "commentaires_sur_les_donnees",
            date: new Date("2023-04-20"),
            contenu: "commentaire risquesEtFreinsÀLever",
          },
        ],
      });

      // When
      await prismaCommentaireRepository.anonymiserAuteurs(
        [auteurId2],
        "utilisateur.supprime@modernisation.gouv.fr",
      );

      // Then
      const commentairesAvecAuteurAnonyme = await prisma.commentaire.findMany({
        where: { auteur_id: auteurId3 },
      });
      expect(commentairesAvecAuteurAnonyme).toHaveLength(2);
      expect(commentairesAvecAuteurAnonyme[0].id).toStrictEqual(
        "b699907e-43c4-43be-8d8d-185fca1b2e50",
      );
      expect(commentairesAvecAuteurAnonyme[1].id).toStrictEqual(
        "e3885e40-caab-4fb6-acf4-0c8f66c9e290",
      );
    });
  });
});
