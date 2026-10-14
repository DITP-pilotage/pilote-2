import type { LanguageModelV4 } from "@ai-sdk/provider";
import { Albert } from "@/server/albert/Albert";
import { traceModel } from "./traceModel";

/**
 * Tout appel LLM d'une eval passe par ici : l'agent et ses sous-agents via
 * `Albert.registerModelWrapper`, le juge via `createEvalModel`.
 */
export function wrapEvalModel(model: LanguageModelV4): LanguageModelV4 {
  return traceModel(model);
}

export function createEvalModel(modelId: string): LanguageModelV4 {
  return wrapEvalModel(Albert.createProvider().chat(modelId));
}
