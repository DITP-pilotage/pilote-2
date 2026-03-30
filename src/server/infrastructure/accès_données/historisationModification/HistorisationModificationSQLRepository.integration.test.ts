import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaHistorisationModificationRepository } from "@/server/infrastructure/accès_données/historisationModification/PrismaHistorisationModificationRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { HistorisationModificationCreationBuilder } from "@/server/app/builders/HistorisationModificationCreationBuilder";

describe("HistorisationModificationSQLRepository", () => {
  let repository: PrismaHistorisationModificationRepository;

  beforeEach(() => {
    repository = new PrismaHistorisationModificationRepository({
      prisma: new PrismaPilote(),
    });
  });

  describe("#anonymiserAuteurs", () => {
    it(
      "doit anonymiser l'auteur des historisations de l'utilisateur supprimé",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurNonCible = await fixtures.utilisateur();
        const auteurASupprimer = await fixtures.utilisateur();
        const auteurAnonyme = await fixtures.utilisateur({
          email: "utilisateur.supprime@modernisation.gouv.fr",
        });

        await fixtures.historisationModification({
          id_auteur: auteurNonCible.id,
        });
        const historisation2 = await fixtures.historisationModification({
          id_auteur: auteurASupprimer.id,
        });
        const historisation3 = await fixtures.historisationModification({
          id_auteur: auteurASupprimer.id,
        });

        // When
        await repository.anonymiserAuteurs(
          [auteurASupprimer.id],
          "utilisateur.supprime@modernisation.gouv.fr",
        );

        // Then
        const historisationsAnonymisees =
          await tx.historisation_modification.findMany({
            where: { id_auteur: auteurAnonyme.id },
          });
        expect(historisationsAnonymisees).toEqual([
          expect.objectContaining({ id: historisation2.id }),
          expect.objectContaining({ id: historisation3.id }),
        ]);
      }),
    );
  });

  describe("#sauvegarderModificationHistorisation", () => {
    it(
      "doit sauvegarder une nouvelle création",
      createIntegrationTest(async (tx) => {
        // Given
        const auteur = await fixtures.utilisateur();

        const historisationModification =
          new HistorisationModificationCreationBuilder()
            .withTableModifieId("metadata_indicateurs")
            .withNouvelleValeur({ indicId: "unId", indicHiddenPilote: true })
            .withAuteurId(auteur.id)
            .build();
        const historisationModification2 =
          new HistorisationModificationCreationBuilder()
            .withTableModifieId("metadata_indicateurs")
            .withNouvelleValeur({ indicId: "unId2", indicHiddenPilote: false })
            .withAuteurId(auteur.id)
            .build();

        // When
        await repository.sauvegarderModificationHistorisation(
          historisationModification,
        );
        await repository.sauvegarderModificationHistorisation(
          historisationModification2,
        );

        // Then
        const listeHistorisationModification =
          await tx.historisation_modification.findMany({
            where: { id_auteur: auteur.id },
          });
        expect(listeHistorisationModification).toEqual([
          expect.objectContaining({ id: historisationModification.id }),
          expect.objectContaining({ id: historisationModification2.id }),
        ]);
      }),
    );
  });
});
