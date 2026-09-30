import type { LanguageModelV4 } from "@ai-sdk/provider";
import { Albert } from "@/server/albert/Albert";
import { traceModel } from "./traceModel";
import { rateLimitModel } from "./rateLimitModel";

/**
 * Débit maximal vers l'API Albert. Réglable dans `.env.evals.local` quand
 * l'API renvoie encore des « Too Many Requests », ou pour accélérer un run
 * quand elle est peu chargée.
 */
const REQUETES_PAR_MINUTE = Number(process.env.EVAL_REQUETES_PAR_MINUTE ?? 15);

const limiterLeDebit = rateLimitModel({
  requetesParMinute: REQUETES_PAR_MINUTE,
});

/**
 * Tout appel LLM d'une eval passe par ici : l'agent et ses sous-agents via
 * `Albert.registerModelWrapper`, le juge via `createEvalModel`. Un seul
 * limiteur, donc un seul budget de requêtes : deux limiteurs doubleraient le
 * débit vers l'API. Le limiteur enveloppe la trace, pour que l'attente ne
 * compte pas dans la durée affichée de l'appel.
 */
export function wrapEvalModel(model: LanguageModelV4): LanguageModelV4 {
  return limiterLeDebit(traceModel(model));
}

export function createEvalModel(modelId: string): LanguageModelV4 {
  return wrapEvalModel(Albert.createProvider().chat(modelId));
}
