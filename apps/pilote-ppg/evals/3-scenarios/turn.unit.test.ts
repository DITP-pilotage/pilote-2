import { buildEvidence, type ScenarioTurn } from "./turn";

const TOUR: ScenarioTurn = {
  turnId: "tour",
  question: "Compare la Bretagne et la Normandie",
  profile: "ditp",
  currentTerritory: "REG-53",
  toolCalls: [
    {
      toolName: "rediger_comparaison_territoires",
      input: { territoire_codes: ["REG-53", "REG-28"] },
    },
  ],
  toolResults: [
    {
      toolName: "rediger_comparaison_territoires",
      input: { territoire_codes: ["REG-53", "REG-28"] },
      output: { markdown: "# Comparaison", termine: true },
    },
  ],
  text: "Voici la comparaison de la Bretagne et de la Normandie.",
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
    const evidence = buildEvidence({ turn: TOUR, matter: "text" });

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
    const evidence = buildEvidence({ turn, matter: "text" });

    // Then
    expect(evidence.conversation).toEqual([
      {
        question: "Fais moi la synthèse du territoire Bretagne",
        answer: "Le TA de la Bretagne est de 51%.",
      },
    ]);
    expect(evidence.toolResults.map((result) => result.toolName)).toEqual([
      "get_taux_avancement_territoire",
      "rediger_comparaison_territoires",
    ]);
  });

  test("les suites affichées sont celles du dernier appel du tour, pas des tours précédents", () => {
    // Given
    const suites = (labels: string[]) => ({
      toolName: "proposer_suites",
      input: {},
      output: { suites: labels.map((label) => ({ label })) },
    });
    const turn: ScenarioTurn = {
      ...TOUR,
      toolResults: [
        ...TOUR.toolResults,
        suites(["Synthèse de la Bretagne"]),
        suites(["Chantiers en retard en Bretagne"]),
      ],
      history: [
        {
          question: "Quel est le taux de la Bretagne ?",
          text: "51 %.",
          toolResults: [suites(["Taux de la Normandie"])],
        },
      ],
    };

    // When
    const evidence = buildEvidence({ turn, matter: "text" });

    // Then
    expect(evidence.suites).toEqual(["Chantiers en retard en Bretagne"]);
  });
});
