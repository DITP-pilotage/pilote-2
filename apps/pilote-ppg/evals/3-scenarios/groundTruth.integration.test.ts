import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { seedEvalWorld } from "../world";
import { seedMondeTerritorial } from "./mondeTerritorial";
import { readGroundTruth } from "./groundTruth";
import { chantiersAttendus } from "./truth";

describe("readGroundTruth", () => {
  it(
    "lit les chantiers en retard et en difficulté du territoire",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });

      // When
      const truth = await readGroundTruth({
        scope: { territoires: ["REG-53"] },
        user: world.users.ditp,
      });

      // Then
      expect(chantiersAttendus({ truth, view: "tous" })).toEqual([
        { id: "CH-005", nom: "Réduire les délais de passage aux urgences" },
        { id: "CH-006", nom: "Développer la prévention en santé" },
      ]);
      expect(truth.territoires).toEqual([
        { code: "REG-53", nom: "Bretagne", maille: "REG" },
      ]);
    }),
  );

  it(
    "suit les sous-territoires quand le scénario les demande",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });

      // When
      const truth = await readGroundTruth({
        scope: { territoires: ["REG-53"], includeSousTerritoires: true },
        user: world.users.ditp,
      });

      // Then
      expect(
        truth.territoires.map((territoire) => territoire.code).sort(),
      ).toEqual(["DEPT-22", "DEPT-29", "DEPT-35", "DEPT-56", "REG-53"]);
    }),
  );

  it(
    "lit les indicateurs des chantiers signalés quand le scénario les demande",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });

      // When
      const truth = await readGroundTruth({
        scope: { territoires: ["REG-53"], indicateurs: true },
        user: world.users.ditp,
      });

      // Then
      expect(truth.indicateurs.map((resultat) => resultat.chantier_id)).toEqual(
        ["CH-005", "CH-006"],
      );
    }),
  );
});
