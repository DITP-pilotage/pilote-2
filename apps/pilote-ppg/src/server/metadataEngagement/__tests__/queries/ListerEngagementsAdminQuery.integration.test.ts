import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerEngagementsAdminQuery } from "@/server/metadataEngagement/queries/ListerEngagementsAdminQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("ListerEngagementsAdminQuery", () => {
  let query: ListerEngagementsAdminQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new ListerEngagementsAdminQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne tous les engagements y compris les supprimés",
      createIntegrationTest(async () => {
        // Given
        await fixtures.metadataEngagement({
          engagement_id: "91",
          engagement_short: "ENG-AA",
          engagement_name: "Actif",
        });
        await fixtures.metadataEngagement({
          engagement_id: "92",
          engagement_short: "ENG-BB",
          engagement_name: "Supprimé",
          deleted_at: new Date("2026-01-01"),
        });

        // When
        const resultat = await query.run();

        // Then
        const ids = resultat.map((e) => e.engagementId);
        expect(ids).toContain("91");
        expect(ids).toContain("92");
        const supprime = resultat.find((e) => e.engagementId === "92");
        expect(supprime?.deletedAt).not.toBeNull();
      }),
    );
  });
});
