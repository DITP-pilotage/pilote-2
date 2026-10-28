import { extractMatter, maskedTerritories } from "./evidence";

describe("extractMatter", () => {
  test("encart rédigé : rend son texte, puis la phrase d'accompagnement", () => {
    expect(
      extractMatter({
        kind: "encart",
        text: "Voici la synthèse.",
        toolCalls: [],
        toolResults: [
          {
            toolName: "rediger_synthese_territoire",
            input: {},
            output: { markdown: "# Synthèse pour le Nord", termine: true },
          },
        ],
      }).matter,
    ).toBe(
      "ENCART RÉDIGÉ :\n# Synthèse pour le Nord\n\nTEXTE D'ACCOMPAGNEMENT :\nVoici la synthèse.",
    );
  });

  test("encart absent : le dit au juge, puis rend la réponse du chat", () => {
    expect(
      extractMatter({
        kind: "encart",
        text: "Voici la synthèse du Nord…",
        toolCalls: [],
        toolResults: [],
      }).matter,
    ).toBe(
      "AUCUN ENCART RÉDIGÉ : l'assistant n'a pas appelé l'outil d'encart.\n\nTEXTE D'ACCOMPAGNEMENT :\nVoici la synthèse du Nord…",
    );
  });

  test("texte : la réponse telle quelle", () => {
    expect(
      extractMatter({
        kind: "text",
        text: "Voici la synthèse.",
        toolCalls: [],
        toolResults: [],
      }),
    ).toEqual({ matter: "Voici la synthèse.", dashboard: null });
  });

  test("dashboard : décrit chaque section et ses widgets, puis le texte", () => {
    const dashboard = {
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
        {
          widgets: [
            { type: "widget_titre_section", titre: "CH-005 — Urgences" },
            {
              type: "widget_cartographie_meteo",
              chantier_id: "CH-005",
              maille: "departementale",
            },
          ],
        },
      ],
    };

    const result = extractMatter({
      kind: "dashboard",
      text: "Voici le tableau de bord.",
      toolCalls: [],
      toolResults: [
        { toolName: "create_dashboard", input: {}, output: dashboard },
      ],
    });

    expect(result.dashboard).toEqual(dashboard);
    expect(result.matter).toBe(
      [
        "TABLEAU DE BORD « Bretagne »",
        "Section 1 :",
        '- widget_taux_avancement_territoire {"territoire_code":"REG-53","jalon":2025}',
        "Section 2 :",
        '- widget_titre_section {"titre":"CH-005 — Urgences"}',
        '- widget_cartographie_meteo {"chantier_id":"CH-005","maille":"departementale"}',
        "",
        "TEXTE D'ACCOMPAGNEMENT :",
        "Voici le tableau de bord.",
      ].join("\n"),
    );
  });

  test("dashboard absent : le dit au juge", () => {
    expect(
      extractMatter({
        kind: "dashboard",
        text: "Voici…",
        toolCalls: [],
        toolResults: [],
      }).matter,
    ).toBe(
      "AUCUN TABLEAU DE BORD COMPOSÉ : l'assistant n'a pas appelé l'outil de dashboard.\n\nTEXTE D'ACCOMPAGNEMENT :\nVoici…",
    );
  });
});

describe("maskedTerritories", () => {
  test("retient les territoires hors périmètre lus par un outil d'encart", () => {
    expect(
      maskedTerritories({
        userTerritories: ["REG-53"],
        toolResults: [
          {
            toolName: "rediger_comparaison_territoires",
            input: {},
            output: {
              markdown: "# Comparaison",
              termine: true,
              donnees: {
                taux: [],
                chantiers_en_retard: {
                  resultats: [
                    { territoire_code: "REG-53" },
                    { territoire_code: "REG-52" },
                  ],
                },
                chantiers_en_difficulte: { resultats: [] },
              },
            },
          },
        ],
      }),
    ).toEqual(["REG-52"]);
  });

  test("retient les territoires hors périmètre rendus par un outil qui masque", () => {
    expect(
      maskedTerritories({
        userTerritories: ["REG-53", "DEPT-35"],
        toolResults: [
          {
            toolName: "get_chantiers",
            input: {},
            output: {
              resultats: [
                { territoire_code: "REG-53" },
                { territoire_code: "REG-52" },
              ],
            },
          },
          {
            toolName: "get_chantier_commentaires",
            input: {},
            output: { resultats: [{ territoire_code: "REG-84" }] },
          },
          {
            toolName: "get_taux_avancement_territoire",
            input: {},
            output: { resultats: [{ territoire_code: "REG-93" }] },
          },
        ],
      }),
    ).toEqual(["REG-52", "REG-84"]);
  });
});
