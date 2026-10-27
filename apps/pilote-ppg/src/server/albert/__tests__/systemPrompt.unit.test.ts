import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";

describe("buildChatSystemPrompt", () => {
  it("commence par la directive de raisonnement", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt.startsWith("Reasoning: high\n")).toBe(true);
  });

  it("ne parle pas de météo (D1)", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).not.toMatch(/m[ée]t[ée]o|SOLEIL|COUVERT|NUAGE|ORAGE/i);
  });

  it("ne renvoie pas à des consignes dans les résultats d'outils", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).not.toContain("_output_instructions");
  });

  it("garde la règle des sous-territoires, que le seul paramètre ne suffisait pas à faire respecter", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain(
      "un seul appel sur le territoire parent avec include_sous_territoires",
    );
  });

  it("impose la recherche pour un territoire désigné par son nom", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain("passe toujours par search_territoires");
  });

  it("donne le jalon du contexte d'accueil", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: { jalon: 2026 },
    });

    // Then
    expect(prompt).toContain("- Jalon courant : 2026");
  });

  it("prend 2025 comme jalon sans contexte", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain("- Jalon courant : 2025");
    expect(prompt).not.toContain("<contexte_utilisateur>");
  });

  it("liste les territoires à accès complet", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: ["REG-53", "DEPT-35"],
      agentContext: null,
    });

    // Then
    expect(prompt).toContain(
      "- Territoires à accès complet : REG-53, DEPT-35",
    );
  });

  it("termine par les instructions du contexte utilisateur", () => {
    // When
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: [],
      agentContext: { instructions: "Territoire par défaut : Bretagne" },
    });

    // Then
    expect(
      prompt.endsWith(
        "<contexte_utilisateur>\nTerritoire par défaut : Bretagne\n</contexte_utilisateur>",
      ),
    ).toBe(true);
  });
});
