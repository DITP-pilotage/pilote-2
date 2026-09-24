import type { LanguageModelV4 } from "@ai-sdk/provider";
import { wrapLanguageModel } from "ai";
import { reportTraceLocalStorage } from "evalite/traces";

/**
 * Remonte chaque appel LLM en trace dans l'UI d'Evalite : prompt envoyé,
 * texte et tool calls rendus, tokens, durée.
 *
 * Écrit à la main plutôt qu'en réutilisant `wrapAISDKModel` d'Evalite : en
 * 1.0.0-beta.16, ce dernier lit et écrit le cache dès qu'un contexte de cache
 * existe — et le runner en installe un à chaque `task`, que `cache: false` et
 * `caching: false` soient passés ou non. Mesuré : des tours d'agent en 30 ms, à
 * 0 token, les essais d'un même cas identiques. Le score ne mesurait plus le
 * modèle mais le rejeu du cache.
 *
 * Hors d'une `task` — dans les scorers juges, par exemple — il n'y a pas de
 * collecteur de traces et l'appel passe sans rien rapporter.
 */
export function traceModel(model: LanguageModelV4): LanguageModelV4 {
  return wrapLanguageModel({
    model,
    middleware: {
      specificationVersion: "v4",
      wrapGenerate: async ({ doGenerate, params }) => {
        const start = performance.now();
        const result = await doGenerate();
        const end = performance.now();

        const report = reportTraceLocalStorage.getStore();
        if (!report) return result;

        const inputTokens = result.usage.inputTokens.total ?? 0;
        const outputTokens = result.usage.outputTokens.total ?? 0;

        report({
          input: params.prompt,
          output: {
            text: result.content
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join(""),
            toolCalls: result.content
              .filter((part) => part.type === "tool-call")
              .map((part) => ({ toolName: part.toolName, input: part.input })),
          },
          usage: {
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
          },
          start,
          end,
        });

        return result;
      },
    },
  });
}
