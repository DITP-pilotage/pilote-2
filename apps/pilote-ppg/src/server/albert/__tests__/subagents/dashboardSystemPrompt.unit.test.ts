import { buildDashboardSystemPrompt } from "@/server/albert/subagents/dashboardSystemPrompt";

describe("buildDashboardSystemPrompt", () => {
  it("introduit un chantier par son niveau de confiance, pas par sa météo (D1)", () => {
    // When
    const prompt = buildDashboardSystemPrompt();

    // Then
    expect(prompt).toContain('"Niveau de confiance : ⛈️ Objectifs compromis"');
    expect(prompt).not.toContain("Météo : ");
  });
});
