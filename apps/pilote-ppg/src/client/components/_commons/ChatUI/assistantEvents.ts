import type {
  AnalyticsDimensions,
  AnalyticsEventName,
} from "@/client/analytics/schema";
import type { ChatScenarios } from "@/components/_commons/ChatUI/ChatEmptyState";
import type { AssistantEvent } from "@/components/_commons/ChatUI/useAssistantTracking";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export type PropositionOrigin = {
  id: string;
  mode: NonNullable<AnalyticsDimensions["proposition_mode"]>;
};

export const propositionMode = (
  mode: "send" | "fill",
): PropositionOrigin["mode"] =>
  mode === "send" ? "envoi_direct" : "preremplissage";

export const propositionsShownEvent = (
  scenarios: ChatScenarios,
): AssistantEvent => ({
  action: "view",
  name: "prompt_proposition.view",
  dimensions: {
    nombre_choix:
      scenarios.kind === "flat"
        ? scenarios.scenarios.length
        : scenarios.groups.reduce(
            (total, group) => total + group.scenarios.length,
            0,
          ),
  },
});

export const prefilledPropositionAfterEdit = (
  current: PropositionOrigin | undefined,
  input: string,
): PropositionOrigin | undefined => (input.trim() === "" ? undefined : current);

export const questionType = ({
  previousMessages,
  fromProposition,
}: {
  previousMessages: PiloteUIMessage[];
  fromProposition: boolean;
}): NonNullable<AnalyticsDimensions["type_question"]> => {
  if (previousMessages.some((message) => message.role === "assistant"))
    return "suivante";
  return fromProposition ? "premiere_proposition" : "premiere_libre";
};

export const llmCallIdOf = (
  message: PiloteUIMessage | undefined,
): string | undefined =>
  message?.role === "assistant" ? message.metadata?.llmCallId : undefined;

export const lastLlmCallId = (
  messages: PiloteUIMessage[],
): string | undefined => llmCallIdOf(messages.at(-1));

export const answerOutcomeEvent = ({
  conversationId,
  message,
  isAbort,
  isError,
}: {
  conversationId: string;
  message: PiloteUIMessage;
  isAbort: boolean;
  isError: boolean;
}): AssistantEvent | null => {
  if (isAbort) return null;
  const dimensions = {
    conversation_id: conversationId,
    llm_call_id: llmCallIdOf(message),
  };
  return isError
    ? { action: "error", name: "answer.error", dimensions }
    : { action: "success", name: "answer.complete", dimensions };
};

type PresentedChoicesPart = Extract<
  PiloteUIMessage["parts"][number],
  { type: "tool-clarify_with_choices"; state: "output-available" }
>;

const isPresentedChoices = (
  part: PiloteUIMessage["parts"][number],
): part is PresentedChoicesPart =>
  part.type === "tool-clarify_with_choices" &&
  part.state === "output-available";

export const choicesPresentedEvent = ({
  conversationId,
  message,
}: {
  conversationId: string;
  message: PiloteUIMessage;
}): AssistantEvent | null => {
  const clarification = (message.parts ?? []).find(isPresentedChoices);
  if (!clarification) return null;
  return {
    action: "view",
    name: "response.choices",
    dimensions: {
      conversation_id: conversationId,
      llm_call_id: llmCallIdOf(message),
      nombre_choix: clarification.output.choices.length,
    },
  };
};

export const isInternalHref = (href: string | undefined): href is string =>
  href !== undefined && href.startsWith("/") && !href.startsWith("//");

export const linkEvent = (href: string | undefined): AssistantEvent => ({
  action: "select",
  name: isInternalHref(href)
    ? "response.link.internal"
    : "response.link.external",
});

export const helpCenterLinkEvent: AssistantEvent = {
  action: "select",
  name: "response.help_center.link",
};

export const helpCenterContactEvent: AssistantEvent = {
  action: "select",
  name: "response.help_center.contact",
};

type ExportName = Extract<AnalyticsEventName, `export.${string}`>;

// Un encart rédigé s'exporte depuis son bouton « Exporter » (PIL-1900)
const encartsExportables = (message: PiloteUIMessage) =>
  (message.parts ?? []).filter(
    (part) =>
      (part.type === "tool-rediger_synthese_territoire" ||
        part.type === "tool-rediger_comparaison_territoires") &&
      part.state === "output-available" &&
      part.output.termine &&
      !part.output.acces_refuse,
  );

/**
 * Les copies de la barre d'actions. Une réponse qui porte un encart rédigé
 * n'a pas « Copier le texte » : l'encart, qui est le contenu de la réponse,
 * se copie depuis son propre bouton.
 */
export const copyExportNames = (message: PiloteUIMessage): ExportName[] => {
  const parts = message.parts ?? [];
  const hasText = parts.some(
    (part) => part.type === "text" && part.text.trim().length > 0,
  );
  const hasDashboard = parts.some(
    (part) =>
      part.type === "tool-create_dashboard" &&
      part.state === "output-available",
  );
  const hasEncart = encartsExportables(message).length > 0;
  return [
    ...(hasText && !hasEncart ? (["export.text"] as const) : []),
    ...(hasDashboard ? (["export.dashboard_image"] as const) : []),
  ];
};

export const exportsAvailableEvents = ({
  conversationId,
  message,
}: {
  conversationId: string;
  message: PiloteUIMessage;
}): AssistantEvent[] => {
  const reports = encartsExportables(message).flatMap(
    () => ["export.report_copy", "export.report_pdf"] as const,
  );
  return [...copyExportNames(message), ...reports].map((name) => ({
    action: "view",
    name,
    dimensions: {
      conversation_id: conversationId,
      llm_call_id: llmCallIdOf(message),
    },
  }));
};
