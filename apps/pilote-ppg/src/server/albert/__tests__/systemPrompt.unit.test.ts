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

describe("buildChatSystemPrompt — indicateurs non à jour", () => {
  it("décrit le routage vers get_indicateurs_non_a_jour et ses limites", () => {
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
    expect(prompt).toContain("### e. Indicateurs non à jour");
    expect(prompt).toContain("get_indicateurs_non_a_jour");
    expect(prompt).toContain("pas d'historique");
  });
});
