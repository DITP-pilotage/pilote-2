import { isDeepStrictEqual } from "node:util";
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
 * Ici, un appel correspond s'il porte AU MOINS les arguments attendus, comparés
 * par valeur. Un argument tableau doit contenir AU MOINS les valeurs attendues :
 * `types: ["freins_a_lever"]` accepte un appel qui demande aussi d'autres types.
 *
 * La sélection en sous-ensemble tolère les appels en trop : sans `forbidden`,
 * un cas négatif passerait même si l'agent appelle aussi l'outil qu'il ne
 * devait pas appeler. Un seul outil interdit appelé suffit à noter 0.
 */
export function scoreExpectedTools({
  output,
  expected,
  forbidden = [],
}: {
  output: AgentTurn;
  expected: ObservedToolCall[] | undefined;
  forbidden?: string[];
}) {
  const { score, verdict } = juger({
    output,
    expectedCalls: expected,
    forbidden,
  });

  // Affiché sous le score dans l'UI : ce que le cas attendait, au même format
  // que la colonne « Outils appelés », pour comparer sans ouvrir le fichier.
  return {
    score,
    metadata: {
      verdict,
      attendus:
        expected === undefined ? "aucune attente" : expected.map(describe),
      interdits: forbidden,
    },
  };
}

function juger({
  output,
  expectedCalls,
  forbidden,
}: {
  output: AgentTurn;
  expectedCalls: ObservedToolCall[] | undefined;
  forbidden: string[];
}) {
  const forbiddenCalled = [
    ...new Set(
      output.toolCalls
        .map((call) => call.toolName)
        .filter((toolName) => forbidden.includes(toolName)),
    ),
  ];

  if (forbiddenCalled.length > 0) {
    return {
      score: 0,
      verdict: `outils interdits appelés : ${forbiddenCalled.join(", ")}`,
    };
  }

  // Un cas négatif peut ne rien exiger : seul compte l'outil qu'il interdit.
  if (expectedCalls === undefined) {
    return { score: 1, verdict: "aucun outil interdit appelé" };
  }

  if (expectedCalls.length === 0) {
    const calledTools = output.toolCalls.map((call) => call.toolName);

    return {
      score: calledTools.length === 0 ? 1 : 0,
      verdict:
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
    verdict:
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
    ([key, value]) => matchesValue(actualInput[key], value),
  );
}

function matchesValue(actual: unknown, expected: unknown) {
  if (Array.isArray(expected) && Array.isArray(actual)) {
    return expected.every((expectedItem) =>
      actual.some((actualItem) => isDeepStrictEqual(actualItem, expectedItem)),
    );
  }

  return isDeepStrictEqual(actual, expected);
}

function describe(call: ObservedToolCall) {
  return call.input === undefined
    ? call.toolName
    : `${call.toolName}(${JSON.stringify(call.input)})`;
}
