import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { PERIMETRE_COORDINATEUR, seedEvalWorld } from "./world";

describe("seedEvalWorld", () => {
  it(
    "restreint la lecture du coordinateur à la Bretagne et ses départements",
    createIntegrationTest(async () => {
      // When
      const world = await seedEvalWorld();

      // Then
      expect(
        world.users.coordinateur.habilitations.lecture.territoires,
      ).toEqual(PERIMETRE_COORDINATEUR);
      expect(world.users.coordinateur.habilitations.lecture.chantiers).toEqual(
        world.chantiers.map((chantier) => chantier.id),
      );
    }),
  );

  it(
    "garde le périmètre complet pour le profil DITP, au premier niveau comme dans users",
    createIntegrationTest(async () => {
      // When
      const world = await seedEvalWorld();

      // Then
      expect(world.users.ditp).toEqual({
        userId: world.userId,
        habilitations: world.habilitations,
      });
      expect(world.habilitations.lecture.territoires).toContain("REG-52");
    }),
  );
});
