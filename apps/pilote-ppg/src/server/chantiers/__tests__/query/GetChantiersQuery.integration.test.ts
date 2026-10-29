import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetChantiersQuery } from "@/server/chantiers/query/GetChantiersQuery";

describe("GetChantiersQuery — plusieurs territoires", () => {
  const query = new GetChantiersQuery({ prisma: new PrismaPilote() });

  const semerChantier = async () => {
    await fixtures.chantierIdentite({
      id: "CH-001",
      nom: "Chantier suivi",
      axe: "Axe 1",
      ppg: "PPG 1",
      ministeres_acronymes: ["MIN-01"],
      statut: "PUBLIE",
    });
    await fixtures.chantierTerritoire({
      id: "CH-001",
      territoire_code: "REG-53",
      code_insee: "53",
      maille: "REG",
      zone_id: "REG-53",
      est_applicable: true,
    });
    await fixtures.chantierTerritoire({
      id: "CH-001",
      territoire_code: "DEPT-29",
      code_insee: "29",
      maille: "DEPT",
      zone_id: "DEPT-29",
      est_applicable: true,
    });
  };

  it(
    "renvoie un résultat par territoire, dans l'ordre des codes demandés",
    createIntegrationTest(async () => {
      // Given
      await semerChantier();

      // When
      const resultats = await query.execute({
        territoireCodes: ["DEPT-29", "REG-53"],
        jalon: 2025,
        chantierIds: ["CH-001"],
      });

      // Then
      expect(
        resultats.map((resultat) => ({
          territoire_code: resultat.territoire_code,
          chantiers: resultat.chantiers.map((chantier) => chantier.chantier.id),
        })),
      ).toEqual([
        { territoire_code: "DEPT-29", chantiers: ["CH-001"] },
        { territoire_code: "REG-53", chantiers: ["CH-001"] },
      ]);
    }),
  );

  it(
    "renvoie un territoire sans chantier avec une liste vide",
    createIntegrationTest(async () => {
      // Given
      await semerChantier();

      // When
      const resultats = await query.execute({
        territoireCodes: ["REG-53", "DEPT-35"],
        jalon: 2025,
        chantierIds: ["CH-001"],
      });

      // Then
      expect(
        resultats.map((resultat) => ({
          territoire_code: resultat.territoire_code,
          chantiers: resultat.chantiers.length,
        })),
      ).toEqual([
        { territoire_code: "REG-53", chantiers: 1 },
        { territoire_code: "DEPT-35", chantiers: 0 },
      ]);
    }),
  );

  it(
    "refuse un code de territoire inconnu",
    createIntegrationTest(async () => {
      // When / Then
      await expect(
        query.execute({
          territoireCodes: ["REG-53", "REG-999"],
          jalon: 2025,
        }),
      ).rejects.toThrow("Territoires inconnus : REG-999");
    }),
  );
});
