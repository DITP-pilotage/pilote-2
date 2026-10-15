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
describe("buildChatSystemPrompt — centre d'aide", () => {
  it("fait primer le centre d'aide sur le glossaire pour les questions d'aide", () => {
    // When
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

    // Then
    expect(prompt).toContain("## consulter_centre_aide");
    expect(prompt).toContain("il prime sur le glossaire de ce prompt");
  });

  it("interdit le LaTeX, que le chat n'affiche pas", () => {
    // When
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

    // Then
    expect(prompt).toContain("## Formules");
    expect(prompt).toContain("N'écris **jamais** de LaTeX");
  });
});
