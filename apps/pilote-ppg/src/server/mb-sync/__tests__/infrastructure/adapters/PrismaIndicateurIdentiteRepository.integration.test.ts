import { PrismaPilote } from "@/server/db/PrismaPilote";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaIndicateurIdentiteRepository } from "@/server/mb-sync/infrastructure/adapters/PrismaIndicateurIdentiteRepository";

describe("PrismaIndicateurIdentiteRepository", () => {
  let repository: PrismaIndicateurIdentiteRepository;

  beforeEach(() => {
    repository = new PrismaIndicateurIdentiteRepository({
      prisma: new PrismaPilote(),
    });
  });

  describe("#findById", () => {
    it(
      "retourne l'indicateur avec son nom et ses mailles applicables",
      createIntegrationTest(async () => {
        // Given
        const chantier = await fixtures.chantierIdentite();
        await fixtures.indicateurIdentite({
          id: "IND-003",
          chantier_id: chantier.id,
          nom: "Taux de chômage",
          mailles_applicables: ["NAT", "REG"],
          unite_mesure: "pourcentage",
        });

        // When
        const result = await repository.findById("IND-003");

        // Then
        expect(result).toEqual({
          nom: "Taux de chômage",
          maillesApplicables: ["NAT", "REG"],
          uniteMesure: "pourcentage",
        });
      }),
    );

    it(
      "retourne null si l'indicateur n'existe pas",
      createIntegrationTest(async () => {
        // When
        const result = await repository.findById("IND-INEXISTANT");

        // Then
        expect(result).toBeNull();
      }),
    );
  });
});
