import { extractMatter, maskedTerritories } from "./evidence";

describe("extractMatter", () => {
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

  test("rapport absent : le dit au juge au lieu de juger le chat", () => {
    const { matter } = extractMatter({
      kind: "rapport",
      text: "Voici la synthèse de la Bretagne…",
      toolCalls: [{ toolName: "get_chantiers", input: {} }],
      toolResults: [],
    });

    expect(matter).toBe(
      "AUCUN RAPPORT EXPORTÉ : l'assistant n'a pas appelé l'outil d'export.\n\nRÉPONSE DU CHAT :\nVoici la synthèse de la Bretagne…",
    );
  });

  test("rapport exporté : rend le contenu passé à l'outil, puis la réponse du chat", () => {
    const { matter } = extractMatter({
      kind: "rapport",
      text: "Votre rapport est disponible au téléchargement.",
      toolCalls: [
        {
          toolName: "export_rapport",
          input: {
            nom_fichier: "synthese-bretagne",
            titre: "Synthèse Bretagne",
            date: "30/09/2026",
            resume: "Résumé.",
            format: "markdown",
            sections: [
              {
                titre: "Chantiers en retard",
                parties: [{ type: "paragraphe", contenu: "CH-005" }],
              },
            ],
          },
        },
      ],
      toolResults: [],
    });

    expect(matter).toContain("Synthèse Bretagne");
    expect(matter).toContain("Chantiers en retard");
    expect(matter).toContain(
      "RÉPONSE DU CHAT :\nVotre rapport est disponible au téléchargement.",
    );
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
      _output_instructions: "",
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
