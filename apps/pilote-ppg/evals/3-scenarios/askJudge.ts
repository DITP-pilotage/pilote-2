import { generateText, Output } from "ai";
import { createEvalModel } from "../evalModel";
import type { Evidence } from "./evidence";
import type { JudgedCriterion } from "./grid";
import {
  buildJudgePrompt,
  JUDGE_MODEL,
  JUDGE_SYSTEM,
  rawVerdictSchema,
  toVerdict,
  type Verdict,
} from "./judge";

/**
 * Un seul appel par tour, pour tous les critères jugés de la grille.
 *
 * Séparé de `judge.ts` : `evalModel` importe `Albert`, qui lit la
 * configuration au chargement, ce que les tests unitaires n'ont pas à fournir.
 */
export async function askJudge({
  evidence,
  criteria,
}: {
  evidence: Evidence;
  criteria: JudgedCriterion[];
}): Promise<Verdict> {
  if (criteria.length === 0) return {};

  const result = await generateText({
    model: createEvalModel(JUDGE_MODEL),
    system: JUDGE_SYSTEM,
    prompt: buildJudgePrompt({ evidence, criteria }),
    output: Output.object({ schema: rawVerdictSchema }),
    temperature: 0,
  });

  return toVerdict({ criteria, raw: result.output });
}
