import { evalite } from "evalite";
import { askJudge } from "../askJudge";
import type { JudgedCriterion } from "../grid";
import { GRIDS } from "../grids";
import { JUDGE_MODEL, type Verdict } from "../judge";
import { CALIBRATION_CASES, type CalibrationCase } from "./references";

/**
 * Calibration du juge — le méta-eval du niveau 3.
 *
 * Chaque famille a une réponse de référence, conforme, et un mutant par
 * critère jugé, qui casse ce critère et lui seul. On mesure l'accord du juge
 * avec nous : il doit détecter le défaut du mutant, et ne rien signaler
 * d'autre. Pas d'agent, pas de base : un appel de juge par cas et par essai.
 *
 * Un critère jugé est FIABLE s'il détecte son mutant et laisse passer la
 * référence sur les trois essais. Un critère non fiable reste dans les
 * suites, mais son score y est marqué : on ne conclut rien sur Albert d'un
 * critère que le juge ne sait pas vérifier.
 *
 * Référence observée : à compléter au premier run.
 */

const judgedCriteria = (testCase: CalibrationCase) =>
  GRIDS[testCase.family].criteria.filter(
    (criterion): criterion is JudgedCriterion =>
      criterion.kind === "judged" &&
      (criterion.applicable?.(testCase.evidence) ?? true),
  );

const familles = [
  ...new Set(CALIBRATION_CASES.map((testCase) => testCase.family)),
];

for (const family of familles) {
  evalite<CalibrationCase, Verdict>(
    `3.0 · Calibration du juge · ${GRIDS[family].family}`,
    {
      data: () =>
        CALIBRATION_CASES.filter((testCase) => testCase.family === family).map(
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

      columns: ({ input, output }) => [
        { label: "Cas", value: input.label },
        { label: "Critère cassé", value: input.broken ?? "—" },
        {
          label: "Verdicts",
          value: Object.entries(output)
            .map(([id, verdict]) => `${verdict.conforme ? "✓" : "✗"} ${id}`)
            .join("\n"),
        },
      ],
    },
  );
}
