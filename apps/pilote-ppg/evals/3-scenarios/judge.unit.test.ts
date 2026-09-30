import { buildJudgePrompt, rawVerdictSchema, toVerdict } from "./judge";

describe("rawVerdictSchema", () => {
  test("demande la preuve avant le verdict, pour que le juge tranche après avoir lu", () => {
    // Calibration du 30/09 : avec le verdict en premier, la preuve disait
    // « non conforme » sous un booléen conforme.
    const champs = Object.keys(rawVerdictSchema.shape.verdicts.element.shape);

    expect(champs).toEqual(["critere", "preuve", "conforme"]);
  });
});
import { judged } from "./grid";
import type { Evidence } from "./evidence";

const CRITERES = [
  judged({
    id: "Pas d'opinion",
    rule: "Identité : aucune opinion, recommandation ni jugement",
    instruction: "La réponse décrit sans conseiller.",
  }),
  judged({
    id: "Résumés condensés",
    rule: "Commentaires : 1 à 2 phrases, jamais verbatim",
    instruction: "Chaque commentaire est résumé en 1 à 2 phrases.",
  }),
];

const EVIDENCE: Evidence = {
  question: "Fais moi la synthèse du territoire Bretagne",
  profile: "ditp",
  currentTerritory: "REG-53",
  answer: "# Synthèse pour Bretagne",
  matter: "# Synthèse pour Bretagne",
  dashboard: null,
  toolCalls: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
  toolResults: [{ toolName: "get_chantiers", output: { resultats: [] } }],
  maskedTerritories: [],
  truth: {
    territoires: [{ code: "REG-53", nom: "Bretagne", maille: "REG" }],
    tauxAvancement: [],
    chantiersEnRetard: [],
    chantiersEnDifficulte: [],
    indicateurs: [],
    commentaires: [],
  },
  tableTerritories: [],
};

describe("toVerdict", () => {
  test("un critère absent de la réponse du juge est non conforme", () => {
    // When
    const verdict = toVerdict({
      criteria: CRITERES,
      raw: {
        verdicts: [
          {
            critere: "Pas d'opinion",
            conforme: true,
            preuve: "aucune recommandation",
          },
        ],
      },
    });

    // Then
    expect(verdict).toEqual({
      "Pas d'opinion": { conforme: true, preuve: "aucune recommandation" },
      "Résumés condensés": { conforme: false, preuve: "absent du verdict" },
    });
  });

  test("ignore un critère que le juge a inventé", () => {
    // When
    const verdict = toVerdict({
      criteria: CRITERES.slice(0, 1),
      raw: {
        verdicts: [
          {
            critere: "Pas d'opinion",
            conforme: false,
            preuve: "« il conviendrait »",
          },
          { critere: "Ton", conforme: true, preuve: "neutre" },
        ],
      },
    });

    // Then
    expect(verdict).toEqual({
      "Pas d'opinion": { conforme: false, preuve: "« il conviendrait »" },
    });
  });
});

describe("buildJudgePrompt", () => {
  test("donne au juge chaque critère avec sa règle, la matière et les données reçues", () => {
    // When
    const prompt = buildJudgePrompt({ evidence: EVIDENCE, criteria: CRITERES });

    // Then
    expect(prompt).toContain(
      "« Pas d'opinion » (règle : Identité : aucune opinion, recommandation ni jugement)",
    );
    expect(prompt).toContain("« Résumés condensés »");
    expect(prompt).toContain("# Synthèse pour Bretagne");
    expect(prompt).toContain('"toolName": "get_chantiers"');
    expect(prompt).toContain("Territoire courant : REG-53");
  });
});
