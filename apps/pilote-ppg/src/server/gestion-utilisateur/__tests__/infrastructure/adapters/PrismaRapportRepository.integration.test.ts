import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaRapportRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaRapportRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaRapportRepository", () => {
  let repository: PrismaRapportRepository;

  beforeEach(() => {
    repository = new PrismaRapportRepository({ prisma: new PrismaPilote() });
  });

  describe("#anonymiserAuteurs", () => {
    it(
      "doit anonymiser l'auteur des rapports importés par l'utilisateur supprimé",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurNonCible = await fixtures.utilisateur();
        const auteurASupprimer = await fixtures.utilisateur();
        await fixtures.utilisateur({
          email: "utilisateur.supprime@modernisation.gouv.fr",
        });

        await fixtures.rapportImportMesureIndicateur({
          utilisateurEmail: auteurNonCible.email,
        });
        const rapport2 = await fixtures.rapportImportMesureIndicateur({
          utilisateurEmail: auteurASupprimer.email,
        });
        const rapport3 = await fixtures.rapportImportMesureIndicateur({
          utilisateurEmail: auteurASupprimer.email,
        });

        // When
        await repository.anonymiserAuteurs(
          [auteurASupprimer.email],
          "utilisateur.supprime@modernisation.gouv.fr",
        );

        // Then
        const rapportsAnonymises =
          await tx.rapport_import_mesure_indicateur.findMany({
            where: {
              utilisateurEmail: "utilisateur.supprime@modernisation.gouv.fr",
            },
          });
        expect(rapportsAnonymises).toEqual([
          expect.objectContaining({ id: rapport2.id }),
          expect.objectContaining({ id: rapport3.id }),
        ]);
      }),
    );
  });
});
