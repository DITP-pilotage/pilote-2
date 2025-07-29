import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { prisma } from "@/server/db/prisma";
import { PrismaPropositionValeurAvancementRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaPropositionValeurAvancementRepository";

describe("PrismaObjectifRepository", () => {
  let prismaPropositionValeurAvancement: PrismaPropositionValeurAvancementRepository;

  beforeEach(() => {
    prismaPropositionValeurAvancement =
      new PrismaPropositionValeurAvancementRepository();
  });
  describe("#anonymiserAuteurs", () => {
    test("doit anonymiser l'auteur des objectifs saisis par l'utilisateur supprimé", async () => {
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

      await prisma.chantier_territoire.createMany({
        data: [
          {
            id: "CH-001",
            territoire_code: "DEPT-01",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
          },
          {
            id: "CH-001",
            territoire_code: "DEPT-02",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
          },
          {
            id: "CH-001",
            territoire_code: "DEPT-03",
            code_insee: "01",
            maille: "DEPT",
            zone_id: "D01",
          },
        ],
      });

      await prisma.indicateur_identite.createMany({
        data: [
          {
            id: "IND-001",
            nom: "indicateur 1",
            chantier_id: "CH-001",
          },
        ],
      });

      await prisma.indicateur_territoire.createMany({
        data: [
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            territoire_code: "DEPT-01",
            code_insee: "01",
            zone_id: "D01",
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            territoire_code: "DEPT-02",
            code_insee: "01",
            zone_id: "D01",
          },
          {
            id: "IND-001",
            chantier_id: "CH-001",
            maille: "DEPT",
            territoire_code: "DEPT-03",
            code_insee: "01",
            zone_id: "D01",
          },
        ],
      });

      await prisma.proposition_valeur_actuelle.createMany({
        data: [
          {
            id: "77053976-1a8e-49f0-b68a-df01da2fc277",
            indic_id: "IND-001",
            territoire_code: "DEPT-01",
            id_auteur_modification: auteurId1,
            valeur_actuelle_proposee: 12,
            date_valeur_actuelle: new Date("2025-01-01"),
            date_proposition: new Date(),
            source_donnee_methode_calcul: "source",
            motif_proposition: "motif",
            statut: "EN_COURS",
          },
          {
            id: "b699907e-43c4-43be-8d8d-185fca1b2e50",
            indic_id: "IND-001",
            territoire_code: "DEPT-02",
            id_auteur_modification: auteurId2,
            valeur_actuelle_proposee: 12,
            date_valeur_actuelle: new Date("2025-01-01"),
            date_proposition: new Date(),
            source_donnee_methode_calcul: "source",
            motif_proposition: "motif",
            statut: "EN_COURS",
          },
          {
            id: "e3885e40-caab-4fb6-acf4-0c8f66c9e290",
            indic_id: "IND-001",
            territoire_code: "DEPT-03",
            id_auteur_modification: auteurId2,
            valeur_actuelle_proposee: 12,
            date_valeur_actuelle: new Date("2025-01-01"),
            date_proposition: new Date(),
            source_donnee_methode_calcul: "source",
            motif_proposition: "motif",
            statut: "EN_COURS",
          },
        ],
      });

      // When
      await prismaPropositionValeurAvancement.anonymiserAuteurs(
        [auteurId2],
        "utilisateur.supprime@modernisation.gouv.fr",
      );

      // Then
      const propositionsAvecAuteurAnonyme =
        await prisma.proposition_valeur_actuelle.findMany({
          where: { id_auteur_modification: auteurId3 },
        });
      expect(propositionsAvecAuteurAnonyme).toHaveLength(2);
      expect(propositionsAvecAuteurAnonyme[0].id).toStrictEqual(
        "b699907e-43c4-43be-8d8d-185fca1b2e50",
      );
      expect(propositionsAvecAuteurAnonyme[1].id).toStrictEqual(
        "e3885e40-caab-4fb6-acf4-0c8f66c9e290",
      );
    });
  });
});
