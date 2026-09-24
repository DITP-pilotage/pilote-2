import type { AgentTurn, ObservedToolCall } from "./types";

/**
 * Scorer de sélection d'outils.
 *
 * Écrit à la main plutôt qu'en réutilisant `toolCallAccuracy` d'Evalite :
 * celui-ci compare les arguments par `deepEqual` sur l'objet ENTIER. Une
 * attente partielle comme `{ view: "en_retard" }` ne matcherait jamais l'appel
 * réel, qui porte aussi `territoire_code`, `jalon` et
 * `include_sous_territoires` — elle plafonnerait à 0,5 à vie, ce qui se lirait
 * comme une régression alors que c'est l'attente qui est mal écrite.
 *
 * Ici, un appel correspond s'il porte AU MOINS les arguments attendus.
 */
export function scoreExpectedTools({
  output,
  expected,
}: {
  output: AgentTurn;
  expected: ObservedToolCall[] | undefined;
}) {
  const expectedCalls = expected ?? [];

  if (expectedCalls.length === 0) {
    const calledTools = output.toolCalls.map((call) => call.toolName);

    return {
      score: calledTools.length === 0 ? 1 : 0,
      metadata:
        calledTools.length === 0
          ? "aucun outil appelé, conforme"
          : `outils appelés à tort : ${calledTools.join(", ")}`,
    };
  }

  const missing = expectedCalls.filter(
    (expectedCall) =>
      !output.toolCalls.some((call) => matches(call, expectedCall)),
  );

  return {
    score: (expectedCalls.length - missing.length) / expectedCalls.length,
    metadata:
      missing.length === 0
        ? "tous les appels attendus sont présents"
        : `manquants : ${missing.map(describe).join(", ")}`,
  };
}

function matches(call: ObservedToolCall, expectedCall: ObservedToolCall) {
  if (call.toolName !== expectedCall.toolName) return false;
  if (expectedCall.input === undefined) return true;

  const actualInput = (call.input ?? {}) as Record<string, unknown>;

  return Object.entries(expectedCall.input as Record<string, unknown>).every(
    ([key, value]) => actualInput[key] === value,
  );
}

function describe(call: ObservedToolCall) {
  return call.input === undefined
    ? call.toolName
    : `${call.toolName}(${JSON.stringify(call.input)})`;
}
