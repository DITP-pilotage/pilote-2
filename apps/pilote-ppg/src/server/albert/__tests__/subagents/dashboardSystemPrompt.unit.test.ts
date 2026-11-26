import { buildDashboardSystemPrompt } from "@/server/albert/subagents/dashboardSystemPrompt";

describe("buildDashboardSystemPrompt", () => {
  it("ne lie plus le paragraphe à la météo ni au commentaire d'un chantier", () => {
    // When
    const prompt = buildDashboardSystemPrompt();

    // Then
    expect(prompt).not.toContain("Niveau de confiance :");
    expect(prompt).not.toContain("champ `commentaire`");
    expect(prompt).toContain(
      "ne reprends ni météo ni commentaire dans un paragraphe",
    );
  });

  it("ne remplit un paragraphe que d'un texte fourni par la description, sans l'inventer ni le reformuler", () => {
    // When
    const prompt = buildDashboardSystemPrompt();

    // Then
    expect(prompt).toContain("n'invente et ne reformule JAMAIS");
    expect(prompt).toContain("Sans texte fourni, pas de widget_paragraph");
  });

  it("garde la carte du niveau de confiance et ne propose plus de variante au paragraphe", () => {
    // When
    const prompt = buildDashboardSystemPrompt();

    // Then
    expect(prompt).not.toContain("n'affiche ni le niveau de confiance");
    expect(prompt).toContain(
      "la carte du niveau de confiance (widget_cartographie_meteo) reste disponible",
    );
    expect(prompt).not.toContain("variant?");
  });
});
