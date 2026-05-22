import { buildChatSystemPrompt } from "@/server/albert/systemPrompt";

describe("buildChatSystemPrompt — inclureSousTerritoires", () => {
  it("injecte le bloc d'instruction quand la capacity est activée", () => {
    // when
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: ["NAT-FR"],
      agentContext: null,
      capacities: {
        synthese: false,
        dashboard: false,
        exportRapport: false,
        inclureSousTerritoires: true,
      },
    });

    // then
    expect(prompt).toContain("Sous-territoires détectés dans la demande");
    expect(prompt).toContain("include_sous_territoires=true");
  });

  it("n'injecte pas le bloc d'instruction quand la capacity est désactivée", () => {
    // when
    const prompt = buildChatSystemPrompt({
      territoiresAccessibles: ["NAT-FR"],
      agentContext: null,
      capacities: {
        synthese: false,
        dashboard: false,
        exportRapport: false,
        inclureSousTerritoires: false,
      },
    });

    // then
    expect(prompt).not.toContain("Sous-territoires détectés dans la demande");
  });
});
