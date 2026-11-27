import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetDimensionSlotsQuery } from "@/server/analytics/queries/GetDimensionSlotsQuery";
import { createIntegrationTest } from "@/test/createIntegrationTest";

describe("GetDimensionSlotsQuery", () => {
  let query: GetDimensionSlotsQuery;

  beforeEach(() => {
    query = new GetDimensionSlotsQuery({ prisma: new PrismaPilote() });
  });

  it(
    "donne les numéros du site Matomo dès la création de la table",
    createIntegrationTest(async () => {
      // When
      const slots = await query.run();

      // Then
      expect(slots).toEqual({
        profil_pilote: 1,
        conversation_id: 2,
        llm_call_id: 3,
        proposition_id: 4,
        proposition_mode: 5,
        type_question: 6,
        nombre_choix: 7,
        position_choix: 8,
        environnement: 9,
        periode_information: 10,
        formation: 11,
      });
    }),
  );

  it(
    "donne le numéro Matomo de chaque dimension configurée",
    createIntegrationTest(async (prisma) => {
      // Given
      await prisma.analytics_dimension.deleteMany();
      await prisma.analytics_dimension.createMany({
        data: [
          { cle: "profil_pilote", slot: 11 },
          { cle: "environnement", slot: 12 },
        ],
      });

      // When
      const slots = await query.run();

      // Then
      expect(slots).toEqual({ profil_pilote: 11, environnement: 12 });
    }),
  );

  it(
    "ignore une dimension que l'application n'envoie plus",
    createIntegrationTest(async (prisma) => {
      // Given
      await prisma.analytics_dimension.deleteMany();
      await prisma.analytics_dimension.createMany({
        data: [
          { cle: "profil_pilote", slot: 11 },
          { cle: "ancienne_cle", slot: 12 },
        ],
      });

      // When
      const slots = await query.run();

      // Then
      expect(slots).toEqual({ profil_pilote: 11 });
    }),
  );
});
