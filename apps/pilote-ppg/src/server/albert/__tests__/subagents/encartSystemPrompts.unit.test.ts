import {
  buildComparaisonTerritoiresSystemPrompt,
  buildSyntheseTerritoireSystemPrompt,
} from "@/server/albert/subagents/encartSystemPrompts";

describe.each([
  ["synthèse", buildSyntheseTerritoireSystemPrompt],
  ["comparaison", buildComparaisonTerritoiresSystemPrompt],
])("gabarit de %s", (_nom, build) => {
  it("parle de niveau de confiance, jamais de météo", () => {
    // When
    const prompt = build();

    // Then
    expect(prompt).toContain("Niveau de confiance");
    expect(prompt).not.toMatch(/m[ée]t[ée]o|SOLEIL|COUVERT|NUAGE|ORAGE/i);
  });

  it("n'utilise aucun bricolage de mise en forme", () => {
    // When
    const prompt = build();

    // Then
    expect(prompt).not.toContain("&nbsp;");
    expect(prompt).not.toMatch(/\\$/m);
  });

  it("fait recopier l'écart tel quel, signe compris", () => {
    // When
    const prompt = build();

    // Then
    expect(prompt).toContain("recopie-le tel quel, signe compris");
    expect(prompt).toContain("commentaire_de_synthese");
  });

  it("distingue un commentaire masqué d'un commentaire absent", () => {
    // When
    const prompt = build();

    // Then
    expect(prompt).toContain(
      "Commentaire non accessible (restriction d'accès)",
    );
    expect(prompt).toContain("Pas de commentaire disponible");
  });
});

describe("gabarit de synthèse", () => {
  it("prévoit le tableau des indicateurs d'un chantier quand ils sont fournis", () => {
    // When
    const prompt = buildSyntheseTerritoireSystemPrompt();

    // Then
    expect(prompt).toContain(
      "| Indicateur | Valeur initiale | Valeur actuelle | Cible | Taux d'avancement |",
    );
  });
});

describe("gabarit de comparaison", () => {
  it("ne laisse pas l'analyse sans objet du national masquer les autres territoires", () => {
    // When
    const prompt = buildComparaisonTerritoiresSystemPrompt();

    // Then
    expect(prompt).toContain(
      "liste normalement les chantiers des autres territoires",
    );
  });

  it("sépare les chantiers communs des chantiers propres à chaque territoire, après un tableau", () => {
    // When
    const prompt = buildComparaisonTerritoiresSystemPrompt();

    // Then
    expect(prompt).toContain("Communs à plusieurs territoires");
    expect(prompt).toContain("| Territoire |");
  });
});
