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
  conversation: [],
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

  test("donne la conversation précédente quand le tour en suit d'autres", () => {
    // When
    const prompt = buildJudgePrompt({
      evidence: {
        ...EVIDENCE,
        question: "Exporte cette synthèse en rapport",
        conversation: [
          {
            question: "Fais moi la synthèse du territoire Bretagne",
            answer: "Le TA de la Bretagne est de 51%.",
          },
        ],
      },
      criteria: CRITERES,
    });

    // Then
    expect(prompt).toContain(
      "CONVERSATION PRÉCÉDENTE :\nUtilisateur : Fais moi la synthèse du territoire Bretagne\nAssistant : Le TA de la Bretagne est de 51%.",
    );
  });

  test("ne parle pas de conversation sur un tour isolé", () => {
    // When
    const prompt = buildJudgePrompt({ evidence: EVIDENCE, criteria: CRITERES });

    // Then
    expect(prompt).not.toContain("CONVERSATION PRÉCÉDENTE");
  });

  test("nomme les territoires attendus dans le tableau d'une comparaison", () => {
    // When
    const prompt = buildJudgePrompt({
      evidence: {
        ...EVIDENCE,
        truth: {
          ...EVIDENCE.truth,
          territoires: [
            { code: "REG-53", nom: "Bretagne", maille: "REG" },
            { code: "DEPT-35", nom: "Ille-et-Vilaine", maille: "DEPT" },
          ],
        },
        tableTerritories: ["REG-53", "DEPT-35"],
      },
      criteria: CRITERES,
    });

    // Then
    expect(prompt).toContain(
      "TERRITOIRES ATTENDUS DANS LE TABLEAU : Bretagne (REG-53), Ille-et-Vilaine (DEPT-35)",
    );
  });
});
