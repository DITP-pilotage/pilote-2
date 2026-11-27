import { createIntegrationTest } from "@/test/createIntegrationTest";
import { seedEvalWorld } from "../world";
import { seedMondeTerritorial } from "./mondeTerritorial";
import { readGroundTruth } from "./groundTruth";
import { chantiersAttendus, synthesesDesChantiers } from "./truth";

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
    "lit les synthèses des chantiers, que la sortie de get_chantiers ne porte plus",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });
      const syntheseCH005 =
        "Deux postes d'urgentistes restent vacants à Brest et Quimper. Le délai médian de passage remonte à 4 h 10 au premier semestre, malgré la régulation téléphonique mise en place en mars.";

      // When
      const truth = await readGroundTruth({
        scope: { territoires: ["REG-53"] },
        user: world.users.ditp,
      });

      // Then
      // CH-005 est en retard et en difficulté : il figure dans les deux vues
      expect(synthesesDesChantiers(truth)).toEqual([
        {
          chantierId: "CH-005",
          territoireCode: "REG-53",
          commentaire: syntheseCH005,
        },
        { chantierId: "CH-006", territoireCode: "REG-53", commentaire: null },
        {
          chantierId: "CH-005",
          territoireCode: "REG-53",
          commentaire: syntheseCH005,
        },
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
        scope: {
          territoires: ["REG-53"],
          perimetre: {
            type: "REGION_ET_SES_DEPARTEMENTS",
            region_code: "REG-53",
          },
        },
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
