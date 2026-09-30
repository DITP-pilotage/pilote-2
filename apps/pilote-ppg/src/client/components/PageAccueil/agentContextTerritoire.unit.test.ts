import { construireAgentContextTerritoire } from "@/components/PageAccueil/agentContextTerritoire";

describe("construireAgentContextTerritoire", () => {
  test("désigne le territoire courant par son nom affiché et son code", () => {
    // When
    const result = construireAgentContextTerritoire({
      territoireCode: "DEPT-35",
      jalon: 2025,
    });

    // Then
    expect(result).toEqual({
      territoireCode: "DEPT-35",
      jalon: 2025,
      instructions:
        "Le territoire courant de l'utilisateur est 35 - Ille-et-Vilaine (code : DEPT-35). Utilise ce territoire par défaut lorsque l'utilisateur ne précise pas de territoire dans sa question.",
    });
  });
});
