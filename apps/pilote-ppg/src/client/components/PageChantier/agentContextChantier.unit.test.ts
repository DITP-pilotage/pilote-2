import { construireAgentContextChantier } from "@/components/PageChantier/agentContextChantier";

describe("construireAgentContextChantier", () => {
  test("désigne le chantier consulté et son territoire", () => {
    // When
    const result = construireAgentContextChantier({
      chantierId: "CH-173",
      chantierNom: "Renforcer notre souveraineté industrielle",
      territoireCode: "DEPT-35",
      jalon: 2025,
    });

    // Then
    expect(result).toEqual({
      territoireCode: "DEPT-35",
      jalon: 2025,
      territoireNom: "35 - Ille-et-Vilaine",
      chantierId: "CH-173",
      chantierNom: "Renforcer notre souveraineté industrielle",
    });
  });
});
