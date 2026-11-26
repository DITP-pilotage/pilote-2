import { buildDashboardSystemPrompt } from "@/server/albert/subagents/dashboardSystemPrompt";

describe("buildDashboardSystemPrompt", () => {
  it("ne lie plus le paragraphe à la météo ni au commentaire d'un chantier", () => {
    // When
    const prompt = buildDashboardSystemPrompt();

    // Then
    expect(prompt).not.toContain("Niveau de confiance :");
    expect(prompt).not.toContain("champ `commentaire`");
    expect(prompt).toContain("n'y reprends ni météo ni commentaire");
  });
});
