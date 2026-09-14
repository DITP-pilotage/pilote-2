import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { RecupererChantierIdParIndicateurIdQuery } from "@/server/chantiers/query/RecupererChantierIdParIndicateurIdQuery";

describe("RecupererChantierIdParIndicateurIdQuery", () => {
  let query: RecupererChantierIdParIndicateurIdQuery;

  beforeEach(() => {
    query = new RecupererChantierIdParIndicateurIdQuery({
      prisma: new PrismaPilote(),
    });
  });

  it(
    "retourne le chantier_id rattaché à l'indicateur",
    createIntegrationTest(async () => {
      // Given
      const chantier = await fixtures.chantierIdentite();
      const indicateur = await fixtures.indicateurIdentite({
        chantier_id: chantier.id,
      });

      // When
      const result = await query.execute(indicateur.id);

      // Then
      expect(result).toBe(chantier.id);
    }),
  );

  it(
    "retourne null quand l'indicateur n'existe pas",
    createIntegrationTest(async () => {
      // When
      const result = await query.execute("IND-INEXISTANT");

      // Then
      expect(result).toBeNull();
    }),
  );
});
