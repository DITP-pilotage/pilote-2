import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaDecisionStrategiqueRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaDecisionStrategiqueRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaDecisionStrategiqueRepository", () => {
  let prismaDecisionStrategiqueRepository: PrismaDecisionStrategiqueRepository;

  beforeEach(() => {
    prismaDecisionStrategiqueRepository =
      new PrismaDecisionStrategiqueRepository({ prisma: new PrismaPilote() });
  });

  describe("#anonymiserAuteurs", () => {
    it(
      "doit anonymiser l'auteur de modification des décisions stratégiques saisies par l'utilisateur supprimé",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurNonCible = await fixtures.utilisateur();
        const auteurASupprimer = await fixtures.utilisateur();
        const auteurAnonyme = await fixtures.utilisateur({
          email: "utilisateur.supprime@modernisation.gouv.fr",
        });

        const chantier = await fixtures.chantierIdentite();

        await fixtures.decisionStrategique({
          chantier_id: chantier.id,
          auteur_modification_id: auteurNonCible.id,
          auteur_creation_id: auteurNonCible.id,
        });
        const decision2 = await fixtures.decisionStrategique({
          chantier_id: chantier.id,
          auteur_modification_id: auteurASupprimer.id,
          auteur_creation_id: auteurNonCible.id,
        });
        const decision3 = await fixtures.decisionStrategique({
          chantier_id: chantier.id,
          auteur_modification_id: auteurASupprimer.id,
          auteur_creation_id: auteurNonCible.id,
        });

        // When
        await prismaDecisionStrategiqueRepository.anonymiserAuteurs(
          [auteurASupprimer.id],
          "utilisateur.supprime@modernisation.gouv.fr",
        );

        // Then
        const decisionsAnonymisees = await tx.decision_strategique.findMany({
          where: { auteur_modification_id: auteurAnonyme.id },
        });
        expect(decisionsAnonymisees).toEqual([
          expect.objectContaining({ id: decision2.id }),
          expect.objectContaining({ id: decision3.id }),
        ]);
      }),
    );

    it(
      "doit anonymiser l'auteur de création des décisions stratégiques saisies par l'utilisateur supprimé",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurNonCible = await fixtures.utilisateur();
        const auteurASupprimer = await fixtures.utilisateur();
        const auteurAnonyme = await fixtures.utilisateur({
          email: "utilisateur.supprime@modernisation.gouv.fr",
        });

        const chantier = await fixtures.chantierIdentite();

        await fixtures.decisionStrategique({
          chantier_id: chantier.id,
          auteur_creation_id: auteurNonCible.id,
          auteur_modification_id: auteurNonCible.id,
        });
        const decision2 = await fixtures.decisionStrategique({
          chantier_id: chantier.id,
          auteur_creation_id: auteurASupprimer.id,
          auteur_modification_id: auteurNonCible.id,
        });
        const decision3 = await fixtures.decisionStrategique({
          chantier_id: chantier.id,
          auteur_creation_id: auteurASupprimer.id,
          auteur_modification_id: auteurNonCible.id,
        });

        // When
        await prismaDecisionStrategiqueRepository.anonymiserAuteurs(
          [auteurASupprimer.id],
          "utilisateur.supprime@modernisation.gouv.fr",
        );

        // Then
        const decisionsAnonymisees = await tx.decision_strategique.findMany({
          where: { auteur_creation_id: auteurAnonyme.id },
        });
        expect(decisionsAnonymisees).toEqual([
          expect.objectContaining({ id: decision2.id }),
          expect.objectContaining({ id: decision3.id }),
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
        const decisionCreationCible = await fixtures.decisionStrategique({
          chantier_id: chantier.id,
          auteur_creation_id: auteurASupprimer.id,
          auteur_modification_id: auteurNonCible.id,
        });
        // auteur_creation = auteurNonCible, auteur_modification = auteurASupprimer
        const decisionModificationCible = await fixtures.decisionStrategique({
          chantier_id: chantier.id,
          auteur_creation_id: auteurNonCible.id,
          auteur_modification_id: auteurASupprimer.id,
        });

        // When
        await prismaDecisionStrategiqueRepository.anonymiserAuteurs(
          [auteurASupprimer.id],
          "utilisateur.supprime@modernisation.gouv.fr",
        );

        // Then
        const decisions = await tx.decision_strategique.findMany({
          where: {
            id: {
              in: [decisionCreationCible.id, decisionModificationCible.id],
            },
          },
        });
        expect(decisions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: decisionCreationCible.id,
              auteur_creation_id: auteurAnonyme.id,
              auteur_modification_id: auteurNonCible.id,
            }),
            expect.objectContaining({
              id: decisionModificationCible.id,
              auteur_creation_id: auteurNonCible.id,
              auteur_modification_id: auteurAnonyme.id,
            }),
          ]),
        );
      }),
    );
  });
});
