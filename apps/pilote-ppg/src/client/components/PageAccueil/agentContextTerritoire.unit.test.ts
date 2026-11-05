import { construireAgentContextTerritoire } from "@/components/PageAccueil/agentContextTerritoire";

describe("construireAgentContextTerritoire", () => {
  test("désigne le territoire courant par son code et son nom affiché", () => {
    // When
    const result = construireAgentContextTerritoire({
      territoireCode: "DEPT-35",
      jalon: 2025,
    });

    // Then
    expect(result).toEqual({
      territoireCode: "DEPT-35",
      jalon: 2025,
      territoireNom: "35 - Ille-et-Vilaine",
    });
  });
});
