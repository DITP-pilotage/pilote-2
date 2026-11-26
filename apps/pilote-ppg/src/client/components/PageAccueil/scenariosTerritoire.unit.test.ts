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

  test("le tableau de bord du territoire ne demande plus la météo ni le commentaire de synthèse", () => {
    // When
    const scenarios = scenariosTerritoireDITP({
      territoireCode: "REG-53",
      jalon: 2026,
      estDITPAdmin: true,
    });

    // Then
    const messages =
      scenarios.kind === "grouped"
        ? scenarios.groups
            .flatMap((groupe) => groupe.scenarios)
            .filter((scenario) => scenario.id === "tableau_de_bord_territoire")
            .map((scenario) => scenario.message)
        : [];
    expect(messages).toEqual([
      expect.not.stringContaining("la météo et le commentaire de synthèse"),
    ]);
  });
});
