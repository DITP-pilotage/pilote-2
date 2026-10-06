import { evalite } from "evalite";
import { askJudge } from "../askJudge";
import { calibrationColumns } from "../columns";
import type { JudgedCriterion } from "../criterion";
import { JUDGE_MODEL, type Verdict } from "../judge";
import { CALIBRATION_CASES, type CalibrationCase } from "./references";

/**
 * Calibration du juge — le méta-eval du niveau 3.
 *
 * Chaque scénario calibré a une réponse de référence, conforme, et un mutant
 * par critère jugé, qui casse ce critère et lui seul. On mesure l'accord du
 * juge avec nous : il doit détecter le défaut du mutant, et ne rien signaler
 * d'autre. Pas d'agent, pas de base : un appel de juge par cas et par essai.
 *
 * Un critère jugé est FIABLE s'il détecte son mutant et laisse passer la
 * référence sur les trois essais. Un critère non fiable reste dans les
 * suites, mais son score y est marqué : on ne conclut rien sur Albert d'un
 * critère que le juge ne sait pas vérifier.
 *
 * Référence observée le 2026-09-30, troisième calibration : 15 critères
 * jugés fiables sur 20. Non fiables : « Chiffres exacts » (valeur
 * d'indicateur fausse détectée 1/3), « Position face à la médiane » (2/3),
 * « Trois volets » (2/3), « Difficultés tirées des commentaires » (2/3),
 * « Actions identifiées » (1/3).
 * Quatrième calibration (second run) : mêmes 5 critères non fiables ;
 * « Chiffres exacts » prend aussi le seuil « 10 points » du gabarit pour un
 * chiffre inventé.
 */

const judgedCriteria = (testCase: CalibrationCase) =>
  testCase.suite.criteria.filter(
    (criterion): criterion is JudgedCriterion =>
      criterion.kind === "judged" &&
      (criterion.applicable?.(testCase.evidence) ?? true),
  );

const suites = [
  ...new Set(CALIBRATION_CASES.map((testCase) => testCase.suite)),
];

for (const suite of suites) {
  evalite<CalibrationCase, Verdict>(
    `3.0 · Calibration du juge · ${suite.name}`,
    {
      data: () =>
        CALIBRATION_CASES.filter((testCase) => testCase.suite === suite).map(
          (testCase) => ({ input: testCase }),
        ),

      task: (input) =>
        askJudge({ evidence: input.evidence, criteria: judgedCriteria(input) }),

      trialCount: 3,

      scorers: [
        {
          name: "Détecte le défaut",
          description: `Juge ${JUDGE_MODEL} : le critère cassé est jugé non conforme. Sans objet pour la référence.`,
          scorer: ({ input, output }) => {
            if (input.broken === null) {
              return { score: 1, metadata: "sans objet" };
            }
            const verdict = output[input.broken];
            return {
              score: verdict && !verdict.conforme ? 1 : 0,
              metadata: verdict?.preuve ?? "absent du verdict",
            };
          },
        },
        {
          name: "Laisse passer le reste",
          description: "Tous les critères intacts sont jugés conformes.",
          scorer: ({ input, output }) => {
            const fauxSignalements = Object.entries(output)
              .filter(
                ([id, verdict]) => id !== input.broken && !verdict.conforme,
              )
              .map(([id, verdict]) => `${id} : ${verdict.preuve}`);
            return {
              score: fauxSignalements.length === 0 ? 1 : 0,
              metadata:
                fauxSignalements.length === 0
                  ? "aucun faux signalement"
                  : fauxSignalements,
            };
          },
        },
      ],

      columns: ({ input, output }) =>
        calibrationColumns({
          label: input.label,
          broken: input.broken,
          question: input.evidence.question,
          matter: input.evidence.matter,
          verdict: output,
        }),
    },
  );
}
