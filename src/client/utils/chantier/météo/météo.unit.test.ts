import { comparerMétéo } from "@/client/utils/chantier/météo/météo";
import { météos } from "@/server/domain/météo/Météo.interface";

describe("comparerMétéo", () => {
  test("retourne 0 si les météos sont identiques", () => {
    // Given
    const météoA = "SOLEIL";
    const météoB = "SOLEIL";

    // When
    const comparaison = comparerMétéo(météoA, météoB, [
      { desc: true, id: "1" },
    ]);

    // Then
    expect(comparaison).toStrictEqual(0);
  });

  test("retourne 1 si la météo A est meilleure que la météo B", () => {
    // Given
    const météoA = "SOLEIL";
    const météoB = "ORAGE";

    // When
    const comparaison = comparerMétéo(météoA, météoB, [
      { desc: true, id: "1" },
    ]);

    // Then
    expect(comparaison).toStrictEqual(1);
  });

  test("retourne -1 si la météo A est pire que la météo B", () => {
    // Given
    const météoA = "ORAGE";
    const météoB = "SOLEIL";

    // When
    const comparaison = comparerMétéo(météoA, météoB, [
      { desc: true, id: "1" },
    ]);

    // Then
    expect(comparaison).toStrictEqual(-1);
  });

  test("fonctionne pour tous les types de météo", () => {
    météos.forEach((météo) => {
      expect(() =>
        comparerMétéo(météo, météo, [{ desc: true, id: "1" }]),
      ).not.toThrow();
    });
  });
});
