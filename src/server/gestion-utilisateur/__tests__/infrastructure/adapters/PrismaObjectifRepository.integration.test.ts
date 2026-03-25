import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaObjectifRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaObjectifRepository";

describe("PrismaObjectifRepository", () => {
  let prismaObjectifRepository: PrismaObjectifRepository;

  beforeEach(() => {
    prismaObjectifRepository = new PrismaObjectifRepository();
  });

  describe("#anonymiserAuteurs", () => {
    it(
      "doit anonymiser l'auteur de modification des objectifs saisis par l'utilisateur supprimé",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurNonCible = await fixtures.utilisateur();
        const auteurASupprimer = await fixtures.utilisateur();
        const auteurAnonyme = await fixtures.utilisateur({
          email: "utilisateur.supprime@modernisation.gouv.fr",
        });

        const chantier = await fixtures.chantierIdentite();

        await fixtures.objectifChantier({
          chantier_id: chantier.id,
          type: "a_faire",
          auteur_modification_id: auteurNonCible.id,
          auteur_creation_id: auteurNonCible.id,
        });
        const objectif2 = await fixtures.objectifChantier({
          chantier_id: chantier.id,
          type: "a_faire",
          auteur_modification_id: auteurASupprimer.id,
          auteur_creation_id: auteurNonCible.id,
        });
        const objectif3 = await fixtures.objectifChantier({
          chantier_id: chantier.id,
          type: "a_faire",
          auteur_modification_id: auteurASupprimer.id,
          auteur_creation_id: auteurNonCible.id,
        });

        // When
        await prismaObjectifRepository.anonymiserAuteurs(
          [auteurASupprimer.id],
          "utilisateur.supprime@modernisation.gouv.fr",
        );

        // Then
        const objectifsAnonymises = await tx.objectif.findMany({
          where: { auteur_modification_id: auteurAnonyme.id },
        });
        expect(objectifsAnonymises).toEqual([
          expect.objectContaining({ id: objectif2.id }),
          expect.objectContaining({ id: objectif3.id }),
        ]);
      }),
    );

    it(
      "doit anonymiser l'auteur de création des objectifs saisis par l'utilisateur supprimé",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurNonCible = await fixtures.utilisateur();
        const auteurASupprimer = await fixtures.utilisateur();
        const auteurAnonyme = await fixtures.utilisateur({
          email: "utilisateur.supprime@modernisation.gouv.fr",
        });

        const chantier = await fixtures.chantierIdentite();

        await fixtures.objectifChantier({
          chantier_id: chantier.id,
          type: "a_faire",
          auteur_creation_id: auteurNonCible.id,
          auteur_modification_id: auteurNonCible.id,
        });
        const objectif2 = await fixtures.objectifChantier({
          chantier_id: chantier.id,
          type: "a_faire",
          auteur_creation_id: auteurASupprimer.id,
          auteur_modification_id: auteurNonCible.id,
        });
        const objectif3 = await fixtures.objectifChantier({
          chantier_id: chantier.id,
          type: "a_faire",
          auteur_creation_id: auteurASupprimer.id,
          auteur_modification_id: auteurNonCible.id,
        });

        // When
        await prismaObjectifRepository.anonymiserAuteurs(
          [auteurASupprimer.id],
          "utilisateur.supprime@modernisation.gouv.fr",
        );

        // Then
        const objectifsAnonymises = await tx.objectif.findMany({
          where: { auteur_creation_id: auteurAnonyme.id },
        });
        expect(objectifsAnonymises).toEqual([
          expect.objectContaining({ id: objectif2.id }),
          expect.objectContaining({ id: objectif3.id }),
        ]);
      }),
    );

    it(
      "doit anonymiser chaque champ auteur indépendamment sans modifier l'autre",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurNonCible = await fixtures.utilisateur();
        const auteurASupprimer = await fixtures.utilisateur();
        const auteurAnonyme = await fixtures.utilisateur({
          email: "utilisateur.supprime@modernisation.gouv.fr",
        });

        const chantier = await fixtures.chantierIdentite();

        // auteur_creation = auteurASupprimer, auteur_modification = auteurNonCible
        const objectifCreationCible = await fixtures.objectifChantier({
          chantier_id: chantier.id,
          type: "a_faire",
          auteur_creation_id: auteurASupprimer.id,
          auteur_modification_id: auteurNonCible.id,
        });
        // auteur_creation = auteurNonCible, auteur_modification = auteurASupprimer
        const objectifModificationCible = await fixtures.objectifChantier({
          chantier_id: chantier.id,
          type: "a_faire",
          auteur_creation_id: auteurNonCible.id,
          auteur_modification_id: auteurASupprimer.id,
        });

        // When
        await prismaObjectifRepository.anonymiserAuteurs(
          [auteurASupprimer.id],
          "utilisateur.supprime@modernisation.gouv.fr",
        );

        // Then
        const objectifs = await tx.objectif.findMany({
          where: { id: { in: [objectifCreationCible.id, objectifModificationCible.id] } },
        });
        expect(objectifs).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: objectifCreationCible.id,
              auteur_creation_id: auteurAnonyme.id,
              auteur_modification_id: auteurNonCible.id,
            }),
            expect.objectContaining({
              id: objectifModificationCible.id,
              auteur_creation_id: auteurNonCible.id,
              auteur_modification_id: auteurAnonyme.id,
            }),
          ]),
        );
      }),
    );
  });
});
