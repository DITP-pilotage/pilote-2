import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db/prisma";
import { PrismaHistorisationModificationRepository } from "@/server/infrastructure/accès_données/historisationModification/PrismaHistorisationModificationRepository";
import { HistorisationModificationCreationBuilder } from "@/server/app/builders/HistorisationModificationCreationBuilder";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

describe("HistorisationModificationSQLRepository", () => {
  let historisationModificationSQLRepository: PrismaHistorisationModificationRepository;
  beforeEach(async () => {
    historisationModificationSQLRepository =
      new PrismaHistorisationModificationRepository();
  });
  describe("#anonymiserAuteurs", () => {
    test("doit anonymiser l'auteur des historisations de l'utilisateur supprimé", async () => {
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
            email: "auteur.inconnu@modernisation.gouv.fr",
            nom: "inconnu",
            prenom: "auteur",
            date_creation: new Date().toISOString(),
            profilCode: ProfilEnum.DITP_ADMIN,
          },
        ],
      });

      await prisma.historisation_modification.createMany({
        data: [
          {
            id: "77053976-1a8e-49f0-b68a-df01da2fc277",
            id_auteur: auteurId1,
            id_objet_modifie: "",
            type_de_modification: "creation",
            date_de_modification: "",
            table_modifie_id: "utilisateur",
          },
          {
            id: "b699907e-43c4-43be-8d8d-185fca1b2e50",
            id_auteur: auteurId2,
            id_objet_modifie: "",
            type_de_modification: "modification",
            date_de_modification: "",
            table_modifie_id: "metadata_indicateur",
          },
          {
            id: "e3885e40-caab-4fb6-acf4-0c8f66c9e290",
            id_auteur: auteurId2,
            id_objet_modifie: "",
            type_de_modification: "creation",
            date_de_modification: "",
            table_modifie_id: "metadata_indicateur",
          },
        ],
      });

      // When
      await historisationModificationSQLRepository.anonymiserAuteurs(
        [auteurId2],
        "auteur.inconnu@modernisation.gouv.fr",
      );

      // Then
      const historisationAvecAuteurAnonyme =
        await prisma.historisation_modification.findMany({
          where: { id_auteur: auteurId3 },
        });
      expect(historisationAvecAuteurAnonyme).toHaveLength(2);
      expect(historisationAvecAuteurAnonyme[0].id).toStrictEqual(
        "b699907e-43c4-43be-8d8d-185fca1b2e50",
      );
      expect(historisationAvecAuteurAnonyme[1].id).toStrictEqual(
        "e3885e40-caab-4fb6-acf4-0c8f66c9e290",
      );
    });
  });

  describe("#sauvegarderModificationHistorisation", () => {
    test("doit sauvegarder une nouvelle création", async () => {
      // GIVEN
      await prisma.utilisateur.create({
        data: {
          id: "416af1ab-a297-42fa-b89a-771cc8d89d0c",
          email: "auteur",
          nom: "auteur",
          prenom: "auteur",
          date_creation: new Date(),
          profilCode: "DITP_ADMIN",
        },
      });
      const historisationModification =
        new HistorisationModificationCreationBuilder()
          .withId(randomUUID())
          .withTableModifieId("metadata_indicateurs")
          .withNouvelleValeur({ indicId: "unId", indicHiddenPilote: true })
          .withAuteurId("416af1ab-a297-42fa-b89a-771cc8d89d0c")
          .build();
      const historisationModification2 =
        new HistorisationModificationCreationBuilder()
          .withId(randomUUID())
          .withTableModifieId("metadata_indicateurs")
          .withNouvelleValeur({ indicId: "unId2", indicHiddenPilote: false })
          .withAuteurId("416af1ab-a297-42fa-b89a-771cc8d89d0c")
          .build();
      // WHEN
      await historisationModificationSQLRepository.sauvegarderModificationHistorisation(
        historisationModification,
      );
      await historisationModificationSQLRepository.sauvegarderModificationHistorisation(
        historisationModification2,
      );
      // THEN
      const listeHistorisationModification =
        await prisma.historisation_modification.findMany();

      expect(listeHistorisationModification).toHaveLength(2);
    });
  });
});
