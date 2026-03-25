import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaIndicateurTerritoireValeurEvenementRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaIndicateurTerritoireValeurEvenementRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaIndicateurTerritoireValeurEvenementRepository", () => {
  let repository: PrismaIndicateurTerritoireValeurEvenementRepository;

  beforeEach(() => {
    repository = new PrismaIndicateurTerritoireValeurEvenementRepository({
      prisma: new PrismaPilote(),
    });
  });

  describe("#anonymiserAuteurs", () => {
    it(
      "doit anonymiser l'auteur des événements valeur indicateur saisis par l'utilisateur supprimé",
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
        const indicateur = await fixtures.indicateurIdentite({
          chantier_id: chantier.id,
        });
        await fixtures.indicateurTerritoire({
          id: indicateur.id,
          chantier_id: chantier.id,
          territoire_code: "NAT-FR",
        });

        await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          id_auteur_modification: auteurNonCible.id,
          type_evenement: "VALEUR_CREEE",
        });
        const evenement2 = await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          id_auteur_modification: auteurASupprimer.id,
          type_evenement: "VALEUR_CREEE",
        });
        const evenement3 = await fixtures.indicateurTerritoireValeurEvenement({
          indic_id: indicateur.id,
          territoire_code: "NAT-FR",
          id_auteur_modification: auteurASupprimer.id,
          type_evenement: "VALEUR_CREEE",
        });

        // When
        await repository.anonymiserAuteurs(
          [auteurASupprimer.id],
          "utilisateur.supprime@modernisation.gouv.fr",
        );

        // Then
        const evenementsAnonymises =
          await tx.indicateur_territoire_valeur_evenement.findMany({
            where: { id_auteur_modification: auteurAnonyme.id },
          });
        expect(evenementsAnonymises).toEqual([
          expect.objectContaining({ id: evenement2.id }),
          expect.objectContaining({ id: evenement3.id }),
        ]);
      }),
    );
  });
});
