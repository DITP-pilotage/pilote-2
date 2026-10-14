import { calibrationColumns, scenarioColumns } from "./columns";

const REPONSE_LONGUE = `# Synthèse pour Bretagne\n\n${"Une phrase de la réponse. ".repeat(40)}`;

describe("scenarioColumns", () => {
  test("montre le message envoyé et la réponse entière, sans la tronquer", () => {
    // When
    const columns = scenarioColumns({
      reason: "Trou complété par le territoire courant",
      profile: "ditp",
      question: "Fais moi la synthèse du territoire Bretagne",
      toolCalls: [
        { toolName: "get_chantiers", input: { territoire_code: "REG-53" } },
      ],
      toolResults: [],
      text: REPONSE_LONGUE,
      withWidgets: false,
    });

    // Then
    expect(columns).toEqual([
      { label: "Scénario", value: "Trou complété par le territoire courant" },
      { label: "Profil", value: "ditp" },
      {
        label: "Message",
        value: "Fais moi la synthèse du territoire Bretagne",
      },
      {
        label: "Outils appelés",
        value: 'get_chantiers({"territoire_code":"REG-53"})',
      },
      { label: "Réponse", value: REPONSE_LONGUE },
    ]);
  });

  test("ajoute les widgets par section pour un tableau de bord", () => {
    // When
    const columns = scenarioColumns({
      reason: "Message envoyé tel quel",
      profile: "ditp",
      question: "Compose un tableau de bord pour Bretagne.",
      toolCalls: [],
      toolResults: [
        {
          toolName: "create_dashboard",
          input: {},
          output: {
            titre: "Bretagne",
            containers: [
              {
                widgets: [
                  {
                    type: "widget_taux_avancement_territoire",
                    territoire_code: "REG-53",
                    jalon: 2025,
                  },
                ],
              },
            ],
            _output_instructions: "",
          },
        },
      ],
      text: "Voici le tableau de bord.",
      withWidgets: true,
    });

    // Then
    expect(columns.at(-1)).toEqual({
      label: "Widgets",
      value: "1. taux_avancement_territoire",
    });
  });
});

describe("calibrationColumns", () => {
  test("montre la demande et la réponse jugée, entières", () => {
    // When
    const columns = calibrationColumns({
      label: "Médiane inventée",
      broken: "Chiffres exacts",
      question: "Fais moi la synthèse du territoire Bretagne",
      matter: REPONSE_LONGUE,
      verdict: {
        "Chiffres exacts": { conforme: false, preuve: "58 % absent" },
        "Pas d'opinion": { conforme: true, preuve: "aucune recommandation" },
      },
    });

    // Then
    expect(columns).toEqual([
      { label: "Cas", value: "Médiane inventée" },
      { label: "Critère cassé", value: "Chiffres exacts" },
      {
        label: "Message",
        value: "Fais moi la synthèse du territoire Bretagne",
      },
      { label: "Réponse jugée", value: REPONSE_LONGUE },
      { label: "Verdicts", value: "✗ Chiffres exacts\n✓ Pas d'opinion" },
    ]);
  });
});
