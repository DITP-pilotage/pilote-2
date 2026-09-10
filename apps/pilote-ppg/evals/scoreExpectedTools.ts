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
  const attendus = expected ?? [];

  if (attendus.length === 0) {
    const appeles = output.toolCalls.map((call) => call.toolName);

    return {
      score: appeles.length === 0 ? 1 : 0,
      metadata:
        appeles.length === 0
          ? "aucun outil appelé, conforme"
          : `outils appelés à tort : ${appeles.join(", ")}`,
    };
  }

  const manquants = attendus.filter(
    (attendu) => !output.toolCalls.some((appel) => correspond(appel, attendu)),
  );

  return {
    score: (attendus.length - manquants.length) / attendus.length,
    metadata:
      manquants.length === 0
        ? "tous les appels attendus sont présents"
        : `manquants : ${manquants.map(decrire).join(", ")}`,
  };
}

function correspond(appel: ObservedToolCall, attendu: ObservedToolCall) {
  if (appel.toolName !== attendu.toolName) return false;
  if (attendu.input === undefined) return true;

  const reel = (appel.input ?? {}) as Record<string, unknown>;

  return Object.entries(attendu.input as Record<string, unknown>).every(
    ([cle, valeur]) => reel[cle] === valeur,
  );
}

function decrire(call: ObservedToolCall) {
  return call.input === undefined
    ? call.toolName
    : `${call.toolName}(${JSON.stringify(call.input)})`;
}
