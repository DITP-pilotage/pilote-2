import { stripPseudoToolCalls } from "@/client/components/_commons/ChatUI/AssistantMessageText";

describe("stripPseudoToolCalls", () => {
  test("laisse un texte sans pseudo-code inchangé", () => {
    // Given
    const text =
      "Voici la synthèse de la région Bretagne.\n\nLe TA est correct.";

    // When
    const result = stripPseudoToolCalls(text);

    // Then
    expect(result).toEqual(
      "Voici la synthèse de la région Bretagne.\n\nLe TA est correct.",
    );
  });

  test("supprime un display_choices multi-lignes en fin de message", () => {
    // Given
    const text =
      "Voici le dashboard proposé.\n\nValidez-vous cette structure ?\n\n---\n\n" +
      'display_choices({\n  "question": "Tu valides ?",\n  "choices": [\n    { "label": "Oui", "value": "yes" },\n    { "label": "Non", "value": "no" }\n  ]\n})';

    // When
    const result = stripPseudoToolCalls(text);

    // Then
    expect(result).toEqual(
      "Voici le dashboard proposé.\n\nValidez-vous cette structure ?",
    );
  });

  test("supprime un compose_dashboard écrit en texte", () => {
    // Given
    const text =
      "Je compose le dashboard.\n\ncompose_dashboard({\n  titre: 'Cockpit',\n  containers: []\n})";

    // When
    const result = stripPseudoToolCalls(text);

    // Then
    expect(result).toEqual("Je compose le dashboard.");
  });

  test("supprime un get_chantiers_en_retard écrit en texte", () => {
    // Given
    const text =
      'Récupération des chantiers :\n\nget_chantiers_en_retard({ "territoire_code": "REG-53", "jalon": 2025 })';

    // When
    const result = stripPseudoToolCalls(text);

    // Then
    expect(result).toEqual("Récupération des chantiers :");
  });

  test("supprime aussi le séparateur --- orphelin avant un tool call strippé", () => {
    // Given
    const text =
      "Validez-vous cette structure ?\n\n---\n\ndisplay_choices({ test: 1 })";

    // When
    const result = stripPseudoToolCalls(text);

    // Then
    expect(result).toEqual("Validez-vous cette structure ?");
  });

  test("laisse passer une mention d'outil en prose sans parenthèse", () => {
    // Given
    const text = "J'ai appelé display_choices pour te proposer une sélection.";

    // When
    const result = stripPseudoToolCalls(text);

    // Then
    expect(result).toEqual(
      "J'ai appelé display_choices pour te proposer une sélection.",
    );
  });

  test("gère un pseudo-code avec JSON imbriqué et accolades multiples", () => {
    // Given
    const text =
      "Confirmation :\n\n" +
      "display_choices({\n" +
      '  "question": "Choix",\n' +
      '  "choices": [\n' +
      '    { "label": "A", "value": { "nested": true } },\n' +
      '    { "label": "B", "value": { "nested": false } }\n' +
      "  ]\n" +
      "})";

    // When
    const result = stripPseudoToolCalls(text);

    // Then
    expect(result).toEqual("Confirmation :");
  });

  test("retourne une chaîne vide pour un input vide", () => {
    // Given
    const text = "";

    // When
    const result = stripPseudoToolCalls(text);

    // Then
    expect(result).toEqual("");
  });
});
