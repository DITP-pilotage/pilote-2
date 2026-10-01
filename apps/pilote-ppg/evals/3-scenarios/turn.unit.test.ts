import { grid } from "./grid";
import { buildEvidence, type ScenarioTurn } from "./turn";

const TEXTE = grid({ family: "Texte", matter: "text", criteria: [] });

const TOUR: ScenarioTurn = {
  turnId: "tour",
  question: "Exporte cette synthèse en rapport",
  profile: "ditp",
  currentTerritory: "REG-53",
  toolCalls: [{ toolName: "export_rapport", input: { format: "markdown" } }],
  toolResults: [
    {
      toolName: "export_rapport",
      input: { format: "markdown" },
      output: { url: "/rapport.md", format: "markdown" },
    },
  ],
  text: "Votre rapport est disponible au téléchargement.",
  stepCount: 2,
  userTerritories: ["REG-53"],
  truth: {
    territoires: [],
    tauxAvancement: [],
    chantiersEnRetard: [],
    chantiersEnDifficulte: [],
    indicateurs: [],
    commentaires: [],
  },
  tableTerritories: [],
  history: [],
};

describe("buildEvidence", () => {
  test("un tour isolé n'a pas de conversation précédente", () => {
    // When
    const evidence = buildEvidence({ turn: TOUR, grid: TEXTE });

    // Then
    expect(evidence.conversation).toEqual([]);
  });

  test("après d'autres tours : la conversation, et les données reçues pendant toute la conversation", () => {
    // Given
    const turn: ScenarioTurn = {
      ...TOUR,
      history: [
        {
          question: "Fais moi la synthèse du territoire Bretagne",
          text: "Le TA de la Bretagne est de 51%.",
          toolResults: [
            {
              toolName: "get_taux_avancement_territoire",
              input: { territoire_code: "REG-53" },
              output: { resultats: [{ taux_avancement_global: "51%" }] },
            },
          ],
        },
      ],
    };

    // When
    const evidence = buildEvidence({ turn, grid: TEXTE });

    // Then
    expect(evidence.conversation).toEqual([
      {
        question: "Fais moi la synthèse du territoire Bretagne",
        answer: "Le TA de la Bretagne est de 51%.",
      },
    ]);
    expect(evidence.toolResults.map((result) => result.toolName)).toEqual([
      "get_taux_avancement_territoire",
      "export_rapport",
    ]);
  });
});
