import type { ObservedToolCall } from "../types";
import { extractMatter } from "./evidence";
import type { Verdict } from "./judge";

/**
 * Les colonnes de l'interface Evalite. Le message et la réponse y figurent
 * en entier : un score ne se comprend qu'en lisant ce qu'Albert a reçu et ce
 * qu'il a répondu, sans ouvrir la trace.
 */

type Column = { label: string; value: string };

type ToolResult = { toolName: string; input: unknown; output: unknown };

function decrireAppel({ toolName, input }: ObservedToolCall) {
  return `${toolName}(${JSON.stringify(input ?? {})})`;
}

function decrireWidgets({
  toolCalls,
  toolResults,
}: {
  toolCalls: ObservedToolCall[];
  toolResults: ToolResult[];
}) {
  const { dashboard } = extractMatter({
    kind: "dashboard",
    text: "",
    toolCalls,
    toolResults,
  });

  return (
    dashboard?.containers
      .map(
        (container, index) =>
          `${index + 1}. ${container.widgets.map((widget) => widget.type.replace("widget_", "")).join(", ")}`,
      )
      .join("\n") ?? "—"
  );
}

export function scenarioColumns({
  reason,
  profile,
  question,
  toolCalls,
  toolResults,
  text,
  withWidgets,
}: {
  reason: string;
  profile: string;
  question: string;
  toolCalls: ObservedToolCall[];
  toolResults: ToolResult[];
  text: string;
  withWidgets: boolean;
}): Column[] {
  return [
    { label: "Scénario", value: reason },
    { label: "Profil", value: profile },
    { label: "Message", value: question },
    {
      label: "Outils appelés",
      value: toolCalls.map(decrireAppel).join("\n→ ") || "—",
    },
    { label: "Réponse", value: text },
    ...(withWidgets
      ? [
          {
            label: "Widgets",
            value: decrireWidgets({ toolCalls, toolResults }),
          },
        ]
      : []),
  ];
}

export function calibrationColumns({
  label,
  broken,
  question,
  matter,
  verdict,
}: {
  label: string;
  broken: string | null;
  question: string;
  matter: string;
  verdict: Verdict;
}): Column[] {
  return [
    { label: "Cas", value: label },
    { label: "Critère cassé", value: broken ?? "—" },
    { label: "Message", value: question },
    { label: "Réponse jugée", value: matter },
    {
      label: "Verdicts",
      value: Object.entries(verdict)
        .map(([critere, avis]) => `${avis.conforme ? "✓" : "✗"} ${critere}`)
        .join("\n"),
    },
  ];
}
