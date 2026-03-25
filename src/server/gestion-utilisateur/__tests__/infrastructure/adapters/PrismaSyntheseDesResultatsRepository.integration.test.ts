import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaSyntheseDesResultatsRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaSyntheseDesResultatsRepository";

describe("PrismaSyntheseDesResultatsRepository", () => {
  let prismaSyntheseDesResultatsRepository: PrismaSyntheseDesResultatsRepository;

  beforeEach(() => {
    prismaSyntheseDesResultatsRepository =
      new PrismaSyntheseDesResultatsRepository();
  });

  describe("#anonymiserAuteurs", () => {
    it(
      "doit anonymiser l'auteur de création des synthèses saisies par l'utilisateur supprimé",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurNonCible = await fixtures.utilisateur();
        const auteurASupprimer = await fixtures.utilisateur();
        const auteurAnonyme = await fixtures.utilisateur({
          email: "utilisateur.supprime@modernisation.gouv.fr",
        });

        const chantier = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          zone_id: "FRANCE",
        });

        await fixtures.syntheseDesResultats({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          auteur_creation_id: auteurNonCible.id,
          auteur_modification_id: auteurNonCible.id,
        });
        const synthese2 = await fixtures.syntheseDesResultats({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          auteur_creation_id: auteurASupprimer.id,
          auteur_modification_id: auteurNonCible.id,
        });
        const synthese3 = await fixtures.syntheseDesResultats({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          auteur_creation_id: auteurASupprimer.id,
          auteur_modification_id: auteurNonCible.id,
        });

        // When
        await prismaSyntheseDesResultatsRepository.anonymiserAuteurs(
          [auteurASupprimer.id],
          "utilisateur.supprime@modernisation.gouv.fr",
        );

        // Then
        const synthesisAnonymisees = await tx.synthese_des_resultats.findMany({
          where: { auteur_creation_id: auteurAnonyme.id },
        });
        expect(synthesisAnonymisees).toEqual([
          expect.objectContaining({ id: synthese2.id }),
          expect.objectContaining({ id: synthese3.id }),
        ]);
      }),
    );

    it(
      "doit anonymiser l'auteur de modification des synthèses saisies par l'utilisateur supprimé",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurNonCible = await fixtures.utilisateur();
        const auteurASupprimer = await fixtures.utilisateur();
        const auteurAnonyme = await fixtures.utilisateur({
          email: "utilisateur.supprime@modernisation.gouv.fr",
        });

        const chantier = await fixtures.chantierIdentite();
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          zone_id: "FRANCE",
        });

        await fixtures.syntheseDesResultats({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          auteur_modification_id: auteurNonCible.id,
          auteur_creation_id: auteurNonCible.id,
        });
        const synthese2 = await fixtures.syntheseDesResultats({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          auteur_modification_id: auteurASupprimer.id,
          auteur_creation_id: auteurNonCible.id,
        });
        const synthese3 = await fixtures.syntheseDesResultats({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          auteur_modification_id: auteurASupprimer.id,
          auteur_creation_id: auteurNonCible.id,
        });

        // When
        await prismaSyntheseDesResultatsRepository.anonymiserAuteurs(
          [auteurASupprimer.id],
          "utilisateur.supprime@modernisation.gouv.fr",
        );

        // Then
        const synthesisAnonymisees = await tx.synthese_des_resultats.findMany({
          where: { auteur_modification_id: auteurAnonyme.id },
        });
        expect(synthesisAnonymisees).toEqual([
          expect.objectContaining({ id: synthese2.id }),
          expect.objectContaining({ id: synthese3.id }),
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
        await fixtures.chantierTerritoire({
          id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          zone_id: "FRANCE",
        });

        // auteur_creation = auteurASupprimer, auteur_modification = auteurNonCible
        const syntheseCreationCible = await fixtures.syntheseDesResultats({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          auteur_creation_id: auteurASupprimer.id,
          auteur_modification_id: auteurNonCible.id,
        });
        // auteur_creation = auteurNonCible, auteur_modification = auteurASupprimer
        const syntheseModificationCible = await fixtures.syntheseDesResultats({
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
          maille: "NAT",
          code_insee: "FR",
          auteur_creation_id: auteurNonCible.id,
          auteur_modification_id: auteurASupprimer.id,
        });

        // When
        await prismaSyntheseDesResultatsRepository.anonymiserAuteurs(
          [auteurASupprimer.id],
          "utilisateur.supprime@modernisation.gouv.fr",
        );

        // Then
        const syntheses = await tx.synthese_des_resultats.findMany({
          where: {
            id: {
              in: [syntheseCreationCible.id, syntheseModificationCible.id],
            },
          },
        });
        expect(syntheses).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: syntheseCreationCible.id,
              auteur_creation_id: auteurAnonyme.id,
              auteur_modification_id: auteurNonCible.id,
            }),
            expect.objectContaining({
              id: syntheseModificationCible.id,
              auteur_creation_id: auteurNonCible.id,
              auteur_modification_id: auteurAnonyme.id,
            }),
          ]),
        );
      }),
    );
  });
});
