import { scenariosTerritoireDITP } from "@/components/PageAccueil/scenariosTerritoire";

describe("scenariosTerritoireDITP", () => {
  test("ne propose plus de rapport : la synthèse se télécharge depuis son encart", () => {
    // When
    const scenarios = scenariosTerritoireDITP({
      territoireCode: "REG-53",
      jalon: 2026,
      estDITPAdmin: true,
    });

    // Then
    const ids =
      scenarios.kind === "grouped"
        ? scenarios.groups.flatMap((groupe) =>
            groupe.scenarios.map((scenario) => scenario.id),
          )
        : [];
    expect(ids).toContain("tableau_de_bord_territoire");
    expect(ids).not.toContain("rapport_markdown");
  });
});
