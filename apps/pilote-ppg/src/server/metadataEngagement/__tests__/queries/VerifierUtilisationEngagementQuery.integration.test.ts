import { PrismaPilote } from "@/server/db/PrismaPilote";
import { VerifierUtilisationEngagementQuery } from "@/server/metadataEngagement/queries/VerifierUtilisationEngagementQuery";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";

describe("VerifierUtilisationEngagementQuery", () => {
  let query: VerifierUtilisationEngagementQuery;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    query = new VerifierUtilisationEngagementQuery({ prisma: prismaPilote });
  });

  describe("run", () => {
    it(
      "retourne estUtilise à false quand aucun chantier n'est associé à l'engagement",
      createIntegrationTest(async () => {
        // Given
        const engagement = await fixtures.metadataEngagement({
          engagement_id: "94",
          engagement_short: "ENG-94",
        });

        // When
        const resultat = await query.run({
          engagementShort: engagement.engagement_short,
        });

        // Then
        expect(resultat).toEqual({ estUtilise: false, nombreChantiers: 0 });
      }),
    );

    it(
      "retourne estUtilise à true avec le nombre de chantiers associés à l'engagement",
      createIntegrationTest(async () => {
        // Given
        const engagement = await fixtures.metadataEngagement({
          engagement_id: "95",
          engagement_short: "ENG-95",
        });
        await fixtures.metadataChantier({
          engagement_short: engagement.engagement_short,
        });

        // When
        const resultat = await query.run({
          engagementShort: engagement.engagement_short,
        });

        // Then
        expect(resultat).toEqual({ estUtilise: true, nombreChantiers: 1 });
      }),
    );
  });
});
